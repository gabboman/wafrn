import { Application, Response } from 'express'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import {
  Ask,
  Emoji,
  EmojiReaction,
  Follows,
  Media,
  Notification,
  Post,
  PostEmojiRelations,
  PostMentionsUserRelation,
  PostReport,
  PostTag,
  PushNotificationToken,
  Quotes,
  sequelize,
  User,
  UserEmojiRelation,
  UserLikesPostRelations
} from '../db.js'
import { authenticateToken } from '../utils/authenticateToken.js'

import { environment } from '../environment.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts.js'
import getBlockedIds from '../utils/cacheGetters/getBlockedIds.js'
import { getMedias } from '../utils/baseQueryNew.js'
import { forceUpdateLastActive } from '../utils/forceUpdateLastActive.js'
import { logger } from '../utils/logger.js'
import { Expo, ExpoPushErrorTicket } from 'expo-server-sdk'

export default function notificationRoutes(app: Application) {
  app.get(
    '/api/v3/notificationsScroll',
    authenticateToken,
    forceUpdateLastActive,
    async (req: AuthorizedRequest, res: Response) => {
      const userId = req.jwtData?.userId ? req.jwtData?.userId : '00000000-0000-0000-0000-000000000000'
      User.findByPk(userId).then(async (usr: any) => {
        if (usr && req.query?.page === '0') {
          usr.lastTimeNotificationsCheck = new Date()
          await usr.save()
        }
      })
      const scrollDate = req.query?.date ? new Date(parseInt(req.query.date as string)) : new Date()
      const mutedPostIds = (await getMutedPosts(userId)).concat(await getMutedPosts(userId, true))
      const notifications = await Notification.findAll({
        where: {
          [Op.or]: [
            {
              postId: {
                [Op.notIn]: mutedPostIds?.length ? mutedPostIds : ['00000000-0000-0000-0000-000000000000']
              }
            },
            {
              notificationType: 'FOLLOW'
            }
          ],

          notifiedUserId: userId,
          createdAt: {
            [Op.lt]: scrollDate
          }
        },
        order: [['createdAt', 'DESC']],
        limit: 20
      })
      const userIds = notifications.map((elem) => elem.userId).concat(userId)
      const postsIds = notifications.map((elem) => elem.postId)
      const emojiReactionsIds = notifications.filter((elem) => elem.emojiReactionId).map((elem) => elem.emojiReactionId)

      const postsWithQuotes = await Quotes.findAll({
        where: {
          quoterPostId: {
            [Op.in]: notifications.filter((elem) => elem.postId != undefined).map((elem) => elem.postId)
          }
        }
      })
      const quotedPostsIds = postsWithQuotes.map((elem) => elem.quotedPostId)

      let users = User.findAll({
        attributes: ['id', 'url', 'name', 'avatar'],
        where: {
          id: {
            [Op.in]: userIds
          }
        }
      })
      let posts = Post.findAll({
        where: {
          id: {
            [Op.in]: [...postsIds, ...quotedPostsIds]
          }
        }
      })
      let asks = Ask.findAll({
        where: {
          postId: {
            [Op.in]: postsIds
          }
        }
      })
      let medias = Media.findAll({
        attributes: [
          'id',
          'NSFW',
          'description',
          'url',
          'external',
          'mediaOrder',
          'mediaType',
          'postId',
          'blurhash',
          'width',
          'height'
        ],
        where: {
          postId: {
            [Op.in]: postsIds
          }
        }
      })
      let tags = PostTag.findAll({
        where: {
          postId: {
            [Op.in]: postsIds
          }
        }
      })
      let userEmojis = UserEmojiRelation.findAll({
        where: {
          userId: {
            [Op.in]: userIds
          }
        }
      })
      let postEmojis = PostEmojiRelations.findAll({
        where: {
          postId: {
            [Op.in]: postsIds
          }
        }
      })
      let emojiReactions = EmojiReaction.findAll({
        where: {
          id: {
            [Op.in]: emojiReactionsIds
          }
        }
      })

      const [_emojiReactions, _userEmojis, _postEmojis] = await Promise.all([emojiReactions, userEmojis, postEmojis])

      let emojisToGet = _emojiReactions
        .map((elem) => elem.emojiId)
        .concat(_userEmojis.map((elem) => elem.emojiId))
        .concat(_postEmojis.map((elem) => elem.emojiId))

      const emojis = await Emoji.findAll({
        where: {
          id: {
            [Op.in]: emojisToGet
          }
        }
      })

      // not including emoji promises here as they were already awaited above
      await Promise.all([users, posts, asks, tags, medias])

      res.send({
        notifications,
        users: await users,
        posts: await posts,
        medias: await medias,
        asks: await asks,
        tags: await tags,
        quotes: postsWithQuotes,
        emojiRelations: {
          userEmojiRelation: _userEmojis,
          postEmojiRelation: _postEmojis,
          postEmojiReactions: _emojiReactions,
          emojis: emojis
        }
      })
    }
  )

  app.get('/api/v2/notificationsCount', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId ? req.jwtData?.userId : '00000000-0000-0000-0000-000000000000'

    //const blockedUsers = await getBlockedIds(userId)
    const startCountDate = (await User.findByPk(userId)).lastTimeNotificationsCheck
    const mutedPostIds = (await getMutedPosts(userId)).concat(await getMutedPosts(userId, true))
    const notificationsCount = await Notification.count({
      where: {
        notifiedUserId: userId,
        [Op.or]: [
          {
            postId: {
              [Op.notIn]: mutedPostIds?.length ? mutedPostIds : ['00000000-0000-0000-0000-000000000000']
            }
          },
          {
            notificationType: 'FOLLOW'
          }
        ],
        createdAt: {
          [Op.gt]: startCountDate
        }
      }
    })
    const pendingFollows = Follows.count({
      where: {
        followedId: userId,
        accepted: false
      }
    })
    let reports = 0
    let usersAwaitingApproval = 0

    if (req.jwtData?.role === 10) {
      // well the user is an admin!
      reports = PostReport.count({
        where: {
          resolved: false
        }
      })
      usersAwaitingApproval = User.count({
        where: {
          activated: false,
          url: {
            [Op.notLike]: '%@%'
          },
          banned: false
        }
      })
    }

    let unansweredAsks = Ask.count({
      where: {
        userAsked: userId,
        answered: false,
        postId: null
      }
    })
    await Promise.all([reports, usersAwaitingApproval, pendingFollows])

    res.send({
      notifications: notificationsCount,
      followsAwaitingApproval: await pendingFollows,
      reports: await reports,
      usersAwaitingApproval: await usersAwaitingApproval,
      asks: await unansweredAsks
    })
  })

  app.post('/api/v3/registerNotificationToken', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId
    const token = req.body.token

    if (!userId || !token) {
      return res.status(400).send({
        success: false,
        error: 'Invalid request. Missing auth token (in auth header) or notification token (in request body).'
      })
    }

    try {
      const existingToken = await PushNotificationToken.findOne({
        where: {
          token
        }
      })
  
      if (existingToken) {
        return res.send({ success: true, message: 'Token already registered.' })
      }
  
      await PushNotificationToken.create({ token, userId })

      res.send({ success: true, message: 'New token registered.' })
    } catch (error) {
      logger.error(error)
      res.status(500).send({ success: false, message: 'Error registering token.' })
    }
  })
}

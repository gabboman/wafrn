import { Application, Response } from 'express'
import { Op, WhereOptions } from 'sequelize'
import {
  Ask,
  Emoji,
  EmojiReaction,
  Follows,
  Media,
  Notification,
  Post,
  PostEmojiRelations,
  PostReport,
  PostTag,
  PushNotificationToken,
  Quotes,
  ServerBlock,
  UnifiedPushData,
  User,
  UserEmojiRelation,
  UserOptions
} from '../models/index.js'
import { authenticateToken } from '../utils/authenticateToken.js'

import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts.js'
import getBlockedIds from '../utils/cacheGetters/getBlockedIds.js'
import { forceUpdateLastActive } from '../utils/forceUpdateLastActive.js'
import { logger } from '../utils/logger.js'
import { UserAttributes } from '../models/user.js'
import { completeEnvironment } from '../utils/backendOptions.js'
import { getallBlockedServers } from '../utils/cacheGetters/getAllBlockedServers.js'

function notificationRoutes(app: Application) {
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
      const blockedUsers = await getBlockedIds(userId, false)
      let scrollDate = req.query?.date ? new Date(parseInt(req.query.date as string)) : new Date()
      if (isNaN(scrollDate.getTime())) {
        scrollDate = new Date()
      }
      const mutedPostIds = (await getMutedPosts(userId)).concat(await getMutedPosts(userId, true))
      let whereObject: any = {
        [Op.or]: [await getNotificationOptions(userId)],
        postId: {
          [Op.or]: [
            {
              [Op.notIn]: mutedPostIds?.length ? mutedPostIds : ['00000000-0000-0000-0000-000000000000']
            },
            {
              [Op.eq]: null
            }
          ]
        },
        notifiedUserId: userId,
        createdAt: {
          [Op.lt]: scrollDate
        }
      }
      const notifications = await Notification.findAll({
        include: [
          {
            model: User,
            as: 'user',
            required: true,
            where: {
              id: {
                [Op.notIn]: blockedUsers.concat([userId])
              },
              banned: false,
              [Op.or]: [
                {
                  [Op.and]: [
                    {
                      federatedHostId: {
                        [Op.notIn]: await getallBlockedServers()
                      }
                    },
                    {
                      federatedHostId: {
                        [Op.notIn]: (
                          await ServerBlock.findAll({ where: { userBlockerId: userId } })
                        ).map((elem) => elem.blockedServerId)
                      }
                    }
                  ]
                },
                {
                  federatedHostId: {
                    [Op.eq]: null
                  }
                }
              ]
            }
          }
        ],
        where: whereObject,
        order: [['createdAt', 'DESC']],
        limit: 20
      })
      const userIds = notifications.map((elem) => elem.userId).concat(userId)
      const postsIds = notifications.map((elem) => elem.postId) as string[]
      const emojiReactionsIds = notifications.filter((elem) => elem.emojiReactionId).map((elem) => elem.emojiReactionId)

      const postsWithQuotes = await Quotes.findAll({
        where: {
          quoterPostId: {
            [Op.in]: notifications.filter((elem) => elem.postId != undefined).map((elem) => elem.postId as string)
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
      const awaitedPostsIds = (await posts).map((post) => post.id)
      const notificationsFiltered = notifications.filter(
        (elem) => elem.notificationType === 'FOLLOW' || (elem.postId && awaitedPostsIds.includes(elem.postId))
      )

      res.send({
        notifications: notificationsFiltered,
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

    const user = await User.findByPk(userId)
    const blockedUsers = await getBlockedIds(userId, false)
    const startCountDate = user?.lastTimeNotificationsCheck
    const mutedPostIds = (await getMutedPosts(userId)).concat(await getMutedPosts(userId, true))
    const notificationsCount = await Notification.count({
      include: [
        {
          model: User,
          as: 'user',
          required: true,
          where: {
            id: {
              [Op.notIn]: blockedUsers.concat([userId])
            },
            banned: false,
            [Op.or]: [
              {
                [Op.and]: [
                  {
                    federatedHostId: {
                      [Op.notIn]: await getallBlockedServers()
                    }
                  },
                  {
                    federatedHostId: {
                      [Op.notIn]: (
                        await ServerBlock.findAll({ where: { userBlockerId: userId } })
                      ).map((elem) => elem.blockedServerId)
                    }
                  }
                ]
              },
              {
                federatedHostId: {
                  [Op.eq]: null
                }
              }
            ]
          }
        }
      ],
      where: {
        notifiedUserId: userId,
        [Op.or]: [await getNotificationOptions(userId)],
        postId: {
          [Op.or]: [
            {
              [Op.notIn]: mutedPostIds?.length ? mutedPostIds : ['00000000-0000-0000-0000-000000000000']
            },
            {
              [Op.eq]: null
            }
          ]
        },
        userId: {
          [Op.notIn]: blockedUsers.concat([userId])
        },
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
    let reports = Promise.resolve(0)
    let usersAwaitingApproval = Promise.resolve(0)

    if (req.jwtData?.role === 10) {
      // well the user is an admin!
      reports = PostReport.count({
        where: {
          resolved: false
        }
      })

      const whereConditions: WhereOptions<UserAttributes> = {
        activated: false,
        url: {
          [Op.notLike]: '%@%'
        },
        banned: false
      }
      if (!completeEnvironment.disableRequireSendEmail) {
        whereConditions.emailVerified = true
      }

      usersAwaitingApproval = User.count({
        where: whereConditions
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
      return res.status(401).send({
        success: false,
        error: 'Invalid request. Missing auth token (in auth header) or notification token (in request body).'
      })
    }

    try {
      const existingToken = await PushNotificationToken.findByPk(token)

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

  app.post('/api/v3/unregisterNotificationToken', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId
    const { token } = req.body

    if (!userId || !token) {
      return res.status(400).send({
        success: false,
        error: 'Invalid request. Missing userId in token or token in request body.'
      })
    }

    try {
      await PushNotificationToken.destroy({
        where: {
          token
        }
      })
      res.send({ success: true, message: 'Notification token unregistered.' })
    } catch (err) {
      logger.error(err)
      res.status(500).send({ success: false, error: 'Error unregistering notification token.' })
    }
  })

  app.post('/api/v3/registerUnifiedPushData', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId
    const { endpoint, deviceAuth, devicePublicKey } = req.body

    if (!userId || !endpoint || !deviceAuth || !devicePublicKey) {
      return res.status(400).send({
        success: false,
        error: 'Invalid request. Missing userId in token or endpoint, deviceAuth, devicePublicKey in request body.'
      })
    }

    try {
      const existingToken = await UnifiedPushData.findOne({
        where: {
          userId,
          endpoint
        }
      })

      if (existingToken) {
        return res.send({ success: true, message: 'Unified push endpoint already registered.' })
      } else {
        await UnifiedPushData.create({ userId, endpoint, deviceAuth, devicePublicKey })
        res.send({ success: true, message: 'Unified push data registered.' })
      }
    } catch (err) {
      logger.error(err)
      res.status(500).send({ success: false, error: 'Error registering unified push data.' })
    }
  })

  app.post('/api/v3/unregisterUnifiedPushData', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId
    const { endpoint } = req.body

    if (!userId || !endpoint) {
      return res.status(400).send({
        success: false,
        error: 'Invalid request. Missing userId in token or endpoint in request body.'
      })
    }

    try {
      await UnifiedPushData.destroy({
        where: {
          userId,
          endpoint
        }
      })
      res.send({ success: true, message: 'Unified push data unregistered.' })
    } catch (err) {
      logger.error(err)
      res.status(500).send({ success: false, error: 'Error unregistering unified push data.' })
    }
  })
}

async function getNotificationOptions(userId: string) {
  const options = await UserOptions.findAll({
    where: {
      userId: userId,
      optionName: {
        [Op.in]: [
          'wafrn.notificationsFrom',
          'wafrn.notifyMentions',
          'wafrn.notifyReactions',
          'wafrn.notifyQuotes',
          'wafrn.notifyFollows',
          'wafrn.notifyRewoots'
        ]
      }
    }
  })
  const optionNotificationsFrom = options.find((elem) => elem.optionName == 'wafrn.notificationsFrom')
  const optionNotifyQuotes = options.find((elem) => elem.optionName == 'wafrn.notifyQuotes')
  const optionNotifyMentions = options.find((elem) => elem.optionName == 'wafrn.notifyMentions')
  const optionNotifyReactions = options.find((elem) => elem.optionName == 'wafrn.notifyReactions')
  const optionNotifyFollows = options.find((elem) => elem.optionName == 'wafrn.notifyFollows')
  const optionNotifyRewoots = options.find((elem) => elem.optionName == 'wafrn.notifyRewoots')

  const notificationTypes = []
  if (!optionNotifyQuotes || optionNotifyQuotes.optionValue != 'false') {
    notificationTypes.push('QUOTE')
  }
  if (!optionNotifyMentions || optionNotifyMentions.optionValue != 'false') {
    notificationTypes.push('MENTION')
  }
  if (!optionNotifyReactions || optionNotifyReactions.optionValue != 'false') {
    notificationTypes.push('EMOJIREACT')
    notificationTypes.push('LIKE')
  }
  if (!optionNotifyFollows || optionNotifyFollows.optionValue != 'false') {
    notificationTypes.push('FOLLOW')
  }
  if (!optionNotifyRewoots || optionNotifyRewoots.optionValue != 'false') {
    notificationTypes.push('REWOOT')
  }

  let res: any = {
    notificationType: {
      [Op.in]: notificationTypes
    }
  }

  if (optionNotificationsFrom && optionNotificationsFrom.optionValue != '1') {
    let validUsers: string[] = []
    switch (optionNotificationsFrom.optionValue) {
      case '2': // followers
        validUsers = (
          await Follows.findAll({
            where: {
              accepted: true,
              followedId: userId
            }
          })
        ).map((elem) => elem.followerId)
      case '3': // followees
        validUsers = (
          await Follows.findAll({
            where: {
              accepted: true,
              followerId: userId
            }
          })
        ).map((elem) => elem.followedId)
      case '4': // mutuals
        const followerIds = (
          await Follows.findAll({
            where: {
              accepted: true,
              followedId: userId
            }
          })
        ).map((elem) => elem.followerId)
        validUsers = (
          await Follows.findAll({
            where: {
              accepted: true,
              followerId: userId,
              followedId: {
                [Op.in]: followerIds
              }
            }
          })
        ).map((elem) => elem.followedId)
    }
    res = {
      ...res,
      userId: {
        [Op.in]: validUsers
      }
    }
  }
  return res
}

export { notificationRoutes, getNotificationOptions }

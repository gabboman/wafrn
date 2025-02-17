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

export default function notificationRoutes(app: Application) {
  app.get(
    '/api/v2/notificationsScroll',
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
      // MULTIPLE DATES ON SAME ENDPOINT SO
      const likesDate = req.query?.likesDate ? new Date(parseInt(req.query.likesDate as string)) : new Date()
      const followsDate = req.query?.followsDate ? new Date(parseInt(req.query.followsDate as string)) : new Date()
      const reblogsDate = req.query?.reblogsDate ? new Date(parseInt(req.query.reblogsDate as string)) : new Date()
      const mentionsDate = req.query?.mentionsDate ? new Date(parseInt(req.query.mentionsDate as string)) : new Date()
      const emojiReactionDate = req.query?.emojiReactionDate
        ? new Date(parseInt(req.query.emojiReactionDate as string))
        : new Date()
      const quotesDate = req.query?.quotesDate ? new Date(parseInt(req.query.quotesDate as string)) : new Date()

      let reblogQuery: any = getReblogQuery(userId, reblogsDate)
      let followsQuery: any = getNewFollows(userId, followsDate)
      let mentionedPostsPreQuery: any = getMentionedPostsId(userId, mentionsDate, Op.lt, true)
      let quotedPostsPreQuery: any = getQuotedPostsQuery(userId, quotesDate, Op.lt, true)
      await Promise.all([reblogQuery, followsQuery, mentionedPostsPreQuery, quotedPostsPreQuery])
      reblogQuery = await reblogQuery
      followsQuery = await followsQuery
      mentionedPostsPreQuery = await mentionedPostsPreQuery
      quotedPostsPreQuery = await quotedPostsPreQuery

      const newQuotes = Quotes.findAll(quotedPostsPreQuery)

      reblogQuery.where.createdAt = {
        [Op.lt]: reblogsDate
      }
      const reblogs = Post.findAll({
        ...reblogQuery,
        limit: environment.postsPerPage
      })
      const mentionedPostsId = mentionedPostsPreQuery.map((mention: any) => mention.postId)

      const mentions = Post.findAll({
        where: {
          id: { [Op.in]: mentionedPostsId }
        }
      })
      followsQuery.where.createdAt = {
        [Op.lt]: followsDate
      }

      const newEmojiReactions = getEmojiReactedPostsId(userId, emojiReactionDate, Op.lt, true)
      const follows = Follows.findAll({
        ...followsQuery,
        limit: environment.postsPerPage
      })
      const likes = getLikedPostsId(userId, likesDate, Op.lt, true)

      await Promise.all([newEmojiReactions, likes, reblogs, newQuotes])
      const postIds = mentionedPostsId
        .concat((await newEmojiReactions).map((react: any) => react.postId))
        .concat((await likes).map((like: any) => like.postId))
        .concat((await reblogs).map((reblog: any) => reblog.parentId))
        .concat((await reblogs).map((reblog: any) => reblog.id))
        .concat((await newQuotes).map((quote: any) => quote.quoterPostId))
        .concat((await newQuotes).map((quote: any) => quote.quotedPostId))

      const medias = getMedias(postIds)
      const posts = Post.findAll({
        where: {
          id: {
            [Op.in]: postIds
          }
        }
      })

      const asks = Ask.findAll({
        attributes: ['question', 'apObject', 'createdAt', 'updatedAt', 'postId', 'userAsked', 'userAsker'],
        where: {
          postId: {
            [Op.in]: postIds
          }
        }
      })

      await Promise.all([asks, posts, medias])

      const userIds = (await reblogs)
        .map((rb: any) => rb.userId)
        .concat((await newEmojiReactions).map((react: any) => react.userId))
        .concat((await follows).map((elem: any) => elem.followerId))
        .concat((await likes).map((like: any) => like.userId))
        .concat([userId])
        .concat((await posts).map((post: any) => post.userId))
        .concat((await asks).map((ask: any) => ask.userAsker))

      const users = User.findAll({
        attributes: ['name', 'url', 'avatar', 'id'],
        where: {
          id: {
            [Op.in]: userIds
          }
        }
      })
      await Promise.all([medias, users])

      const userEmojis = await UserEmojiRelation.findAll({
        where: {
          userId: {
            [Op.in]: (await users).map((usr: any) => usr.id)
          }
        }
      })

      const emojis = Emoji.findAll({
        where: {
          id: {
            [Op.in]: (await newEmojiReactions)
              .map((emojireact: any) => emojireact.emojiId)
              .concat(userEmojis.map((usrEmjRel: any) => usrEmjRel.emojiId))
          }
        }
      })

      res.send({
        asks: await asks,
        emojiReactions: await newEmojiReactions,
        emojis: await emojis,
        users: await users,
        posts: await posts,
        reblogs: await reblogs,
        likes: await likes,
        mentions: await mentions,
        follows: await follows,
        medias: await medias,
        quotes: await newQuotes,
        userEmojisRelation: await userEmojis
      })
    }
  )

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
                [Op.notIn]: mutedPostIds?.length ? mutedPostIds : []
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
            [Op.in]: postsIds
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
      await Promise.all([users, posts, asks, tags, medias, userEmojis, postEmojis, emojiReactions])
      let emojisToGet = (await emojiReactions)
        .map((elem) => elem.emojiId)
        .concat((await userEmojis).map((elem) => elem.emojiId))
        .concat((await postEmojis).map((elem) => elem.emojiId))
      const emojis = await Emoji.findAll({
        where: {
          id: {
            [Op.in]: emojisToGet
          }
        }
      })
      await Promise.all([users, posts, asks, tags, medias, userEmojis, postEmojis, emojiReactions])

      res.send({
        notifications,
        users: await users,
        posts: await posts,
        medias: await medias,
        asks: await asks,
        tags: await tags,
        emojiRelations: {
          userEmojiRelation: await userEmojis,
          postEmojiRelation: await postEmojis,
          postEmojiReactions: await emojiReactions,
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
  async function getMentionedPostsId(
    userId: string,
    startCountDate: Date,
    operator: any,
    limit?: boolean
  ): Promise<any[]> {
    let superMutedIds = await getMutedPosts(userId, true)
    superMutedIds = superMutedIds ? superMutedIds : []
    const fullyMutedDoNotCountForMentions = superMutedIds.length
      ? (
          await sequelize.query(
            `SELECT "postsId" FROM "postsancestors" where "ancestorId" IN (${superMutedIds.map(
              (elem) => "'" + elem + "'"
            )})`,
            {
              type: QueryTypes.SELECT
            }
          )
        ).map((elem: any) => elem.postsId)
      : []
    return await PostMentionsUserRelation.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['postId', 'userId'],
      limit: limit ? environment.postsPerPage : Number.MAX_SAFE_INTEGER,
      where: {
        userId: userId,
        postId: {
          [Op.notIn]: fullyMutedDoNotCountForMentions
        },
        createdAt: {
          [operator]: isNaN(startCountDate.getDate()) ? new Date() : startCountDate
        }
      }
    })
  }

  async function getLikedPostsId(userId: string, startCountDate: Date, operator: any, limit = false) {
    return await UserLikesPostRelations.findAll({
      order: [['createdAt', 'DESC']],
      limit: limit ? environment.postsPerPage : Number.MAX_SAFE_INTEGER,
      include: [
        {
          model: Post,
          required: true,
          attributes: [],
          where: {
            userId: userId
          }
        }
      ],
      where: {
        postId: {
          [Op.notIn]: await getMutedPosts(userId)
        },
        createdAt: {
          [operator]: isNaN(startCountDate.getDate()) ? new Date() : startCountDate
        },
        userId: {
          [Op.notIn]: await getBlockedIds(userId)
        }
      }
    })
  }

  async function getEmojiReactedPostsId(
    userId: string,
    startCountDate: Date,
    operator: any,
    limit = false
  ): Promise<any[]> {
    return EmojiReaction.findAll({
      order: [['createdAt', 'DESC']],
      limit: limit ? environment.postsPerPage : Number.MAX_SAFE_INTEGER,
      include: [
        {
          model: Post,
          required: true,
          attributes: [],
          where: {
            userId: userId
          }
        }
      ],
      where: {
        postId: {
          [Op.notIn]: await getMutedPosts(userId)
        },
        createdAt: {
          [operator]: isNaN(startCountDate.getDate()) ? new Date() : startCountDate
        },
        userId: {
          [Op.notIn]: await getBlockedIds(userId)
        }
      }
    })
  }

  async function getNewFollows(userId: string, startCountDate: Date) {
    return {
      order: [['createdAt', 'DESC']],
      where: {
        followerId: {
          [Op.notIn]: await getBlockedIds(userId)
        },
        createdAt: {
          [Op.gt]: startCountDate
        },
        followedId: userId,
        accepted: true
      }
    }
  }

  async function getReblogQuery(userId: string, startCountDate: Date) {
    return {
      order: [['createdAt', 'DESC']],
      where: {
        isReblog: true,
        parentId: {
          [Op.notIn]: await getMutedPosts(userId)
        },
        privacy: {
          [Op.ne]: 10
        },
        createdAt: {
          [Op.gt]: startCountDate
        },
        userId: {
          [Op.notIn]: [userId].concat(await getBlockedIds(userId))
        },
        literal: Sequelize.literal(
          `"posts"."id" IN (select "id" from "posts" where "parentId" in (select "id" from "posts" where "userId" = '${userId}'))`
        )
      }
    }
  }

  async function getQuotedPostsQuery(userId: string, startCountDate: Date, operator: any, limit = false) {
    return {
      order: [['createdAt', 'DESC']],
      limit: limit ? environment.postsPerPage : 50,
      where: {
        createdAt: {
          [operator]: isNaN(startCountDate.getDate()) ? new Date() : startCountDate
        },
        literal: Sequelize.literal(`"quotedPostId" IN (SELECT "id" FROM "posts" WHERE "userId"= '${userId}')`)
      }
    }
  }
}

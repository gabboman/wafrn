import { Application, Response } from 'express'
import { Op, QueryTypes, Sequelize } from 'sequelize'
import {
  Ask,
  Emoji,
  EmojiReaction,
  Follows,
  Media,
  Post,
  PostEmojiRelations,
  PostMentionsUserRelation,
  PostReport,
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
import { isDatabaseMysql } from '../utils/isDatabaseMysql.js'

export default function notificationRoutes(app: Application) {
  app.get('/api/v2/notificationsScroll', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
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

    const newQuotes = await Quotes.findAll(await getQuotedPostsQuery(userId, quotesDate, Op.lt, true))

    const reblogQuery: any = await getReblogQuery(userId, reblogsDate)
    reblogQuery.where.createdAt = {
      [Op.lt]: reblogsDate
    }
    const reblogs = Post.findAll({
      ...reblogQuery,
      limit: environment.postsPerPage
    })

    const mentionedPostsId = (await getMentionedPostsId(userId, mentionsDate, Op.lt, true)).map(
      (mention: any) => mention.postId
    )

    const mentions = Post.findAll({
      where: {
        id: { [Op.in]: mentionedPostsId }
      }
    })
    const followsQuery: any = await getNewFollows(userId, followsDate)
    followsQuery.where.createdAt = {
      [Op.lt]: followsDate
    }

    const newEmojiReactions = getEmojiReactedPostsId(userId, emojiReactionDate, Op.lt, true)
    const follows = Follows.findAll({
      ...followsQuery,
      limit: environment.postsPerPage
    })
    const likes = getLikedPostsId(userId, likesDate, Op.lt, true)
    const postIds = mentionedPostsId
      .concat((await newEmojiReactions).map((react: any) => react.postId))
      .concat((await likes).map((like: any) => like.postId))
      .concat((await reblogs).map((reblog: any) => reblog.parentId))
      .concat((await reblogs).map((reblog: any) => reblog.id))
      .concat((await newQuotes).map((quote: any) => quote.quoterPostId))
      .concat((await newQuotes).map((quote: any) => quote.quotedPostId))

    const medias = getMedias(postIds)
    const posts = await Post.findAll({
      where: {
        id: {
          [Op.in]: postIds
        }
      }
    })

    const asks = await Ask.findAll({
      attributes: ['question', 'apObject', 'createdAt', 'updatedAt', 'postId', 'userAsked', 'userAsker'],
      where: {
        postId: {
          [Op.in]: postIds
        }
      }
    })

    const userIds = (await reblogs)
      .map((rb: any) => rb.userId)
      .concat((await newEmojiReactions).map((react: any) => react.userId))
      .concat((await follows).map((elem: any) => elem.followerId))
      .concat((await likes).map((like: any) => like.userId))
      .concat([userId])
      .concat(posts.map((post: any) => post.userId))
      .concat(asks.map((ask: any) => ask.userAsker))

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
      asks,
      emojiReactions: await newEmojiReactions,
      emojis: await emojis,
      users: await users,
      posts: await posts,
      reblogs: await reblogs,
      likes: await likes,
      mentions: await mentions,
      follows: await follows,
      medias: await medias,
      quotes: await newQuotes
    })
  })

  app.get('/api/v2/notificationsCount', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId ? req.jwtData?.userId : '00000000-0000-0000-0000-000000000000'

    //const blockedUsers = await getBlockedIds(userId)
    const startCountDate = (await User.findByPk(userId)).lastTimeNotificationsCheck
    const mentionIds = await getMentionedPostsId(userId, startCountDate, Op.gt)
    const postMentions = mentionIds.length
    const newPostReblogs = Post.count(await getReblogQuery(userId, startCountDate))
    const newEmojiReactions = getEmojiReactedPostsId(userId, startCountDate, Op.gt)
    const newFollows = Follows.count(await getNewFollows(userId, startCountDate))
    const newQuotes = Quotes.count(await getQuotedPostsQuery(userId, startCountDate, Op.gt))
    const newLikes = (await getLikedPostsId(userId, startCountDate, Op.gt)).length
    const pendingFollows = Follows.count({
      where: {
        followedId: userId,
        accepted: false
      }
    })
    let reports = 0
    let usersAwaitingAproval = 0

    if (req.jwtData?.role === 10) {
      // well the user is an admin!
      reports = PostReport.count({
        where: {
          resolved: false
        }
      })
      usersAwaitingAproval = User.count({
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
    await Promise.all([
      newFollows,
      postMentions,
      newLikes,
      reports,
      usersAwaitingAproval,
      newPostReblogs,
      newEmojiReactions,
      newQuotes,
      pendingFollows
    ])

    res.send({
      notifications:
        (await newFollows) +
        (await postMentions) +
        (await newLikes) +
        (await newPostReblogs) +
        (await newEmojiReactions).length +
        (await newQuotes),
      followsAwaitingAproval: await pendingFollows,
      reports: await reports,
      usersAwaitingAproval: await usersAwaitingAproval,
      asks: await unansweredAsks
    })
  })
  async function getMentionedPostsId(
    userId: string,
    startCountDate: Date,
    operator: any,
    limit?: boolean
  ): Promise<any[]> {
    let superMutedIds = await getMutedPosts(userId, true);
    superMutedIds = superMutedIds ? superMutedIds : []
    const fullyMutedDoNotCountForMentions = superMutedIds.length
      ? (
        await sequelize.query(
          isDatabaseMysql()
            ? `SELECT postsId FROM postsancestors where ancestorId IN (${superMutedIds.map((elem) => '"' + elem + '"')})`
            : `SELECT "postsId" FROM "postsancestors" where "ancestorId" IN (${superMutedIds.map(
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
        content: '',
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
          isDatabaseMysql()
            ? `posts.id IN (select id from posts where parentId in (select id from posts where userId = "${userId}"))`
            : `"posts"."id" IN (select "id" from "posts" where "parentId" in (select "id" from "posts" where "userId" = '${userId}'))`
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
        literal: Sequelize.literal(
          isDatabaseMysql()
            ? `quotedPostId IN (SELECT id FROM posts WHERE userId= "${userId}")`
            : `"quotedPostId" IN (SELECT "id" FROM "posts" WHERE "userId"= '${userId}')`
        )
      }
    }
  }
}

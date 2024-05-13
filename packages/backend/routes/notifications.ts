import { Application, Response } from 'express'
import { Op, Sequelize } from 'sequelize'
import {
  Emoji,
  EmojiReaction,
  Follows,
  Media,
  Post,
  PostEmojiRelations,
  PostMediaRelations,
  PostMentionsUserRelation,
  PostReport,
  Quotes,
  User,
  UserEmojiRelation,
  UserLikesPostRelations
} from '../db'
import { authenticateToken } from '../utils/authenticateToken'

import { environment } from '../environment'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts'
import getBlockedIds from '../utils/cacheGetters/getBlockedIds'
import { getMedias } from '../utils/baseQueryNew'

export default function notificationRoutes(app: Application) {
  app.get('/api/v2/notificationsScroll', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId ? req.jwtData?.userId : ''
    User.findByPk(userId).then(async (usr: any) => {
      if (usr && req.query?.page === '0') {
        usr.lastTimeNotificationsCheck = new Date()
        await usr.save()
      }
    })
    // MULTIPLE DATES ON SAME ENDPOINT SO
    const likesDate = req.query?.likesDate ? new Date(req.query.likesDate as string) : new Date()
    const followsDate = req.query?.followsDate ? new Date(req.query.followsDate as string) : new Date()
    const reblogsDate = req.query?.reblogsDate ? new Date(req.query.reblogsDate as string) : new Date()
    const mentionsDate = req.query?.mentionsDate ? new Date(req.query.mentionsDate as string) : new Date()
    const emojiReactionDate = req.query?.emojiReactionDate
      ? new Date(req.query.emojiReactionDate as string)
      : new Date()
    const quotesDate = req.query?.quotesDate ? new Date(req.query.quotesDate as string) : new Date()

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
    let userIds = (await reblogs)
      .map((rb: any) => rb.userId)
      .concat((await newEmojiReactions).map((react: any) => react.userId))
      .concat((await follows).map((elem: any) => elem.followerId))
      .concat((await likes).map((like: any) => like.userId))
      .concat([userId])
    const medias = getMedias(postIds)
    const posts = await Post.findAll({
      where: {
        id: {
          [Op.in]: postIds
        }
      }
    })
    userIds = userIds.concat(posts.map((post: any) => post.userId))
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
          [Op.in]: (await users).map((usr : any) => usr.id)
        }
      }
    })

    const emojis = await Emoji.findAll({
      where: {
        id: {
          [Op.in]: (await newEmojiReactions).map((emojireact: any) => emojireact.emojiId).concat( userEmojis.map((usrEmjRel: any) => usrEmjRel.emojiId ) )
        }
      }
    })
    
    res.send({
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
    const userId = req.jwtData?.userId ? req.jwtData?.userId : ''
    //const blockedUsers = await getBlockedIds(userId)
    const startCountDate = (await User.findByPk(userId)).lastTimeNotificationsCheck
    const mentionIds = await getMentionedPostsId(userId, startCountDate, Op.gt)
    const postMentions = mentionIds.length
    const newPostReblogs = Post.count(await getReblogQuery(userId, startCountDate))
    const newEmojiReactions = getEmojiReactedPostsId(userId, startCountDate, Op.gt)
    const newFollows = Follows.count(await getNewFollows(userId, startCountDate))
    const newQuotes = Quotes.count(await getQuotedPostsQuery(userId, startCountDate, Op.gt))
    const newLikes = (await getLikedPostsId(userId, startCountDate, Op.gt)).length

    let reports = 0
    let awaitingAproval = 0

    if (req.jwtData?.role === 10) {
      // well the user is an admin!
      reports = PostReport.count({
        where: {
          resolved: false
        }
      })
      awaitingAproval = User.count({
        where: {
          activated: false,
          url: {
            [Op.notLike]: '%@%'
          },
          banned: false
        }
      })
    }

    await Promise.all([
      newFollows,
      postMentions,
      newLikes,
      reports,
      awaitingAproval,
      newPostReblogs,
      newEmojiReactions,
      newQuotes
    ])

    res.send({
      notifications:
        (await newFollows) +
        (await postMentions) +
        (await newLikes) +
        (await newPostReblogs) +
        (await newEmojiReactions).length +
        (await newQuotes),

      reports: await reports,
      awaitingAproval: await awaitingAproval
    })
  })
  async function getMentionedPostsId(
    userId: string,
    startCountDate: Date,
    operator: any,
    limit?: boolean
  ): Promise<any[]> {
    return await PostMentionsUserRelation.findAll({
      order: [['createdAt', 'DESC']],
      attributes: ['postId', 'userId'],
      limit: limit ? environment.postsPerPage : Number.MAX_SAFE_INTEGER,
      where: {
        userId: userId,
        createdAt: {
          [operator]: startCountDate
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
          [operator]: startCountDate
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
          [operator]: startCountDate
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
        followedId: userId
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
          `posts.id IN (select id from posts where parentId in (select id from posts where userId = "${userId}"))`
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
          [operator]: startCountDate
        },
        quotedPostId: {
          [Op.notIn]: (await getMentionedPostsId(userId, startCountDate, operator)).map(
            (mention: any) => mention.postId
          )
        },
        literal: Sequelize.literal(`quotedPostId IN (SELECT id FROM posts WHERE userId= "${userId}")`)
      }
    }
  }
}

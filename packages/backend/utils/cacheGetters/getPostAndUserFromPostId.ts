import { Op } from 'sequelize'
import { Ask, Emoji, EmojiReaction, Media, Post, PostTag, User, UserLikesPostRelations } from '../../models/index.js'
import { redisCache } from '../redis.js'
import { Privacy } from '../../models/post.js'

async function getPostAndUserFromPostId(postId: string): Promise<{ found: boolean; data?: any }> {
  const cacheResult = await redisCache.get('postAndUser:' + postId)
  let res: { found: boolean; data?: any } = cacheResult ? JSON.parse(cacheResult) : { found: false }
  if (!cacheResult) {
    const dbQuery = await Post.findOne({
      include: [
        {
          model: Ask
        },
        {
          model: User,
          as: 'user',
          required: true,
          where: {
            banned: false
          }
        },
        {
          model: Post,
          include: [
            {
              model: User,
              as: 'user'
            }
          ],
          as: 'quoted',
          where: {
            isDeleted: false
          },
          required: false
        },
        {
          model: Post,
          as: 'parent',
          required: false,
          where: {
            isDeleted: false
          },
          include: [
            {
              model: Media,
              required: false
            },
            {
              model: PostTag,
              required: false
            }
          ]
        },
        {
          model: User,
          as: 'mentionPost',
          required: false
        },
        {
          model: Media,
          required: false
        },
        {
          model: PostTag,
          required: false
        },
        {
          model: Emoji,
          required: false
        }
      ],
      where: {
        id: postId,
        isDeleted: false,
        privacy: {
          [Op.notIn]: [Privacy.LocalOnly]
        }
      }
    })
    if (dbQuery) {
      // check if its a bsky post because we dont enjoy bsky posts going to fedi!
      const parents = await dbQuery.getAncestors({
        include: [
          {
            model: User,
            as: 'user'
          }
        ]
      })
      const isBskyPost =
        parents.length > 0 && !parents.every((elem) => !(elem.bskyUri && elem.user.url.startsWith('@')))
      if (isBskyPost) {
        res = { found: false }
        return res
      }

      let likes = UserLikesPostRelations.findAll({
        where: {
          postId: postId
        }
      })
      let shares = Post.findAll({
        where: {
          parentId: postId,
          isReblog: true
        }
      })
      let reacts = EmojiReaction.findAll({
        where: {
          postId: postId
        }
      })
      Promise.all([likes, shares, reacts])

      res = { found: true, data: dbQuery.dataValues }
      if (res.data.ask) {
        const userAsker = await User.findByPk(res.data.ask.userAsker)
        res.data.ask.asker = userAsker
      }
      res.data.shares = await shares
      res.data.likes = await likes
      res.data.reacts = await reacts
    } else {
      res = { found: false }
    }
    if (res.found) {
      await redisCache.set('postAndUser:' + postId, JSON.stringify(res), 'EX', 300)
    } else {
      // await redisCache.set('postAndUser:' + postId, JSON.stringify(res), 'EX', 60)
    }
  }
  return res
}

export { getPostAndUserFromPostId }

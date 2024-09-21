import { Op } from 'sequelize'
import { Ask, Emoji, EmojiReaction, Media, Post, PostTag, User, UserLikesPostRelations } from '../../db'
import { redisCache } from '../redis'

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
          required: true
        },
        {
          model: Post,
          as: 'quoted',
          required: false
        },
        {
          model: Post,
          as: 'parent',
          required: false,
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
        privacy: {
          [Op.notIn]: [2]
        }
      }
    })
    if (dbQuery) {
      let likes = UserLikesPostRelations.findAll({
        where: {
          postId: postId
        }
      })
      let shares = Post.findAll({
        where: {
          parentId: postId,
          content: ''
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
      res.data.shares = await shares;
      res.data.likes = await likes;
      res.data.reacts = await reacts;
    } else {
      res = { found: false }
    }
    if (res.found) {
      await redisCache.set('postAndUser:' + postId, JSON.stringify(res))
    } else {
      await redisCache.set('postAndUser:' + postId, JSON.stringify(res), 'EX', 60)
    }
  }
  return res
}

export { getPostAndUserFromPostId }

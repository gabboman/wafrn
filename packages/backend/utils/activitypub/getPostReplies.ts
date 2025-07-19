import { Op } from 'sequelize'
import { Post, User } from '../../models/index.js'
import { completeEnvironment } from '../backendOptions.js'
import { redisCache } from '../redis.js'
import { Privacy } from '../../models/post.js'

async function getPostReplies(postId: string) {
  let resString = await redisCache.get('postReplies:' + postId)
  if (!resString) {
    const posts = await Post.findAll({
      attributes: ['id', 'parentId', 'remotePostId', 'privacy'],
      include: [
        {
          model: User,
          as: 'user',
          required: true,
          where: {
            banned: false,
            [Op.or]: [
              // this could be faster.
              // TODO in case of doing ALL replies, we need a better way to not send bsky only posts to fedi
              {
                url: {
                  [Op.like]: '@%@%'
                }
              },
              {
                url: {
                  [Op.notLike]: '@%'
                }
              }
            ]
          }
        }
      ],
      where: {
        isReblog: false,
        parentId: postId,
        privacy: {
          [Op.notIn]: [Privacy.LocalOnly, Privacy.DirectMessage]
        }
      }
    })
    resString = JSON.stringify(
      posts.map((elem: any) =>
        elem.remotePostId ? elem.remotePostId : `${completeEnvironment.frontendUrl}/fediverse/post/${elem.id}`
      )
    )
    await redisCache.set('postReplies:' + postId, resString, 'EX', 60)
  }

  return JSON.parse(resString)
}

export { getPostReplies }

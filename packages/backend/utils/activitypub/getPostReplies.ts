import { Op } from 'sequelize'
import { Post } from '../../db.js'
import { environment } from '../../environment.js'

async function getPostReplies(postId: string) {
  // TODO: cache this. Also make it so if the post has no text but medias or tags also apears on the list
  const posts = await Post.findAll({
    attributes: ['id', 'parentId', 'remotePostId', 'privacy'],
    where: {
      content: {
        [Op.ne]: ''
      },
      parentId: postId,
      privacy: {
        [Op.notIn]: [2, 10]
      }
    }
  })
  return posts.map((elem: any) =>
    elem.remotePostId ? elem.remotePostId : `${environment.frontendUrl}/fediverse/post/${elem.id}`
  )
}

export { getPostReplies }

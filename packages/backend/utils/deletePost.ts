import { Op } from 'sequelize'
import { Post, PostMentionsUserRelation, PostTag, Quotes, UserLikesPostRelations } from '../db'

async function deletePostCommon(id: string) {
  const postToDelete = await Post.findByPk(id)
  if (postToDelete) {
    const quotesToDelete = await Quotes.findAll({
      where: {
        [Op.or]: [
          {
            quotedPostId: id
          },
          {
            quoterPostId: id
          }
        ]
      }
    })
    if (quotesToDelete) {
      Promise.all(quotesToDelete.map((qte: any) => qte.destroy()))
    }
    const children = await postToDelete.getDescendents()
    postToDelete.removeMedias(await postToDelete.getMedias())
    await PostTag.destroy({
      where: {
        postId: postToDelete.id
      }
    })
    await UserLikesPostRelations.destroy({
      where: {
        postId: postToDelete.id
      }
    })

    await PostMentionsUserRelation.destroy({
      where: {
        postId: postToDelete.id
      }
    })
    if (children.length === 0) {
      await postToDelete.destroy()
    } else {
      postToDelete.content_warning = ''
      postToDelete.content = '<p>This post has been deleted</p>'
      await postToDelete.save()
    }
  }
}

export { deletePostCommon }

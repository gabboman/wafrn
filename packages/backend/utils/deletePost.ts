import { Op } from 'sequelize'
import {
  Notification,
  Post,
  PostMentionsUserRelation,
  PostTag,
  Quotes,
  User,
  UserLikesPostRelations
} from '../models/index.js'
import { getDeletedUser } from './cacheGetters/getDeletedUser.js'

async function deletePostCommon(id: string) {
  const postToDelete = await Post.findByPk(id)
  if (postToDelete) {
    if (postToDelete.isReblog) {
      await Notification.destroy({
        where: {
          postId: postToDelete.parentId,
          userId: postToDelete.userId
        }
      })
    } else {
      await Notification.destroy({
        where: {
          postId: id
        }
      })
    }

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
      postToDelete.isDeleted = true
      const deletedUser = (await getDeletedUser()) as User
      postToDelete.userId = deletedUser.id
      await postToDelete.save()
    }
  }
}

export { deletePostCommon }

import { Blocks, Post } from '../../../db'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { deletePostCommon } from '../../deletePost'
import { logger } from '../../logger'
import { removeUser } from '../removeUser'
import { signAndAccept } from '../signAndAccept'

async function DeleteActivity(body: any, remoteUser: any, user: any) {
  const apObject: activityPubObject = body.object
  // TODO divide in files
  try {
    if (typeof apObject.object === 'string') {
      // we assume its just the url of an user
      await removeUser(apObject.object)
      await signAndAccept({ body: body }, remoteUser, user)
      return
    } else {
      switch (apObject.type) {
        case 'Block': {
          logger.info('Remove block')
          logger.debug(apObject)
          const blockToRemove = await Blocks.findOne({
            where: {
              remoteId: apObject.id
            }
          })
          if (blockToRemove) {
            await blockToRemove.destroy()
          }
          await signAndAccept({ body: body }, remoteUser, user)
          break
        }
        case 'Tombstone': {
          const postToDelete = await Post.findOne({
            where: {
              remotePostId: apObject.id
            }
          })
          if (postToDelete) {
            await deletePostCommon(postToDelete.id)
          }
          await signAndAccept({ body: body }, remoteUser, user)
          break
        }
        default: {
          logger.info(`DELETE not implemented ${apObject.type}`)
          logger.info(apObject)
        }
      }
    }
  } catch (error) {
    logger.trace({
      message: 'error with delete petition',
      error: error,
      petition: body
    })
  }
}

export { DeleteActivity }

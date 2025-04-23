import { Blocks, Post } from '../../../models/index.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { deletePostCommon } from '../../deletePost.js'
import { logger } from '../../logger.js'
import { redisCache } from '../../redis.js'
import { removeUser } from '../removeUser.js'
import { signAndAccept } from '../signAndAccept.js'

async function DeleteActivity(body: activityPubObject, remoteUser: any, user: any) {
  // TODO ????
  const apObject: activityPubObject = body.object.type ? body.object : body
  // TODO divide in files
  try {
    if (typeof apObject.object === 'string') {
      // we assume its just the url of an user
      await removeUser(apObject.object)
      // await signAndAccept({ body: body }, remoteUser, user)
      return
    } else {
      switch (apObject.type) {
        case 'Tombstone': {
          const postToDelete = await Post.findOne({
            where: {
              remotePostId: apObject.id
            }
          })
          if (postToDelete) {
            await deletePostCommon(postToDelete.id)
          }
          // await signAndAccept({ body: body }, remoteUser, user)
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

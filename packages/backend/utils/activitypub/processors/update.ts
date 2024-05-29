import { Post } from '../../../db'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { logger } from '../../logger'
import { getPostThreadRecursive } from '../getPostThreadRecursive'
import { getRemoteActor } from '../getRemoteActor'
import { signAndAccept } from '../signAndAccept'

async function UpdateActivity(body: any, remoteUser: any, user: any) {
  const apObject: activityPubObject = body.object
  // TODO divide this one in files too?
  switch (apObject.type) {
    case 'Question':
    case 'Article':
    case 'Note': {
      const localPost = await Post.findOne({
        where: {
          remotePostId: apObject.id
        }
      })
      await getPostThreadRecursive(user, apObject.id, apObject.object, localPost ? localPost.id : undefined)
      await signAndAccept({ body: body }, remoteUser, user)
      break
    }
    case 'Service':
    case 'Person': {
      if (apObject.id) {
        await getRemoteActor(apObject.id, user, true)
        await signAndAccept({ body: body }, remoteUser, user)
      }
      break
    }
    // ignore cases
    case 'Video':
    case 'CacheFile': {
      await signAndAccept({ body: body }, remoteUser, user)
      break
    }
    default: {
      logger.info(`update not implemented ${apObject.type}`)
      logger.info(apObject)
    }
  }
}

export { UpdateActivity }

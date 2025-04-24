import { Post } from '../../../models/index.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { logger } from '../../logger.js'
import { getPostThreadRecursive } from '../getPostThreadRecursive.js'
import { getRemoteActor } from '../getRemoteActor.js'
import { signAndAccept } from '../signAndAccept.js'

async function UpdateActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body.object.id ? body.object : body
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
      // await signAndAccept({ body: body }, remoteUser, user)
      break
    }
    case 'OrderedCollection': {
      // TODO do something better than this
      // we force an update of the user who asked for this. Not the nicest thing to do but well
      await getRemoteActor(remoteUser.remoteId, user, true)
      // await signAndAccept({ body: body }, remoteUser, user)
      break
    }
    case 'Application':
    case 'Service':
    case 'Person': {
      if (apObject.id) {
        await getRemoteActor(apObject.id, user, true)
        // await signAndAccept({ body: body }, remoteUser, user)
      }
      break
    }
    // ignore cases
    case 'Video':
    case 'CacheFile': {
      // await signAndAccept({ body: body }, remoteUser, user)
      break
    }
    default: {
      logger.info(`update not implemented ${apObject.type}`)
      logger.info(apObject)
    }
  }
}

export { UpdateActivity }

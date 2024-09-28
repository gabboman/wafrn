import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { getPostThreadRecursive } from '../getPostThreadRecursive.js'
import { signAndAccept } from '../signAndAccept.js'

async function RemoveActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  const postToNotFeature = await getPostThreadRecursive(user, apObject.object)
  if (postToNotFeature) {
    postToNotFeature.featured = false
    await postToNotFeature.save()
  }
  // await signAndAccept({ body: body }, remoteUser, user)
}

export { RemoveActivity }

import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { getPostThreadRecursive } from '../getPostThreadRecursive'
import { signAndAccept } from '../signAndAccept'

async function RemoveActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  const postToNotFeature = await getPostThreadRecursive(user, apObject.object)
  if (postToNotFeature) {
    postToNotFeature.featured = false
    await postToNotFeature.save()
  }
  await signAndAccept({ body: body }, remoteUser, user)
}

export { RemoveActivity }

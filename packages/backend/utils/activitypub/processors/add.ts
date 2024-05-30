import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { getPostThreadRecursive } from '../getPostThreadRecursive'
import { signAndAccept } from '../signAndAccept'

async function AddActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  const postToFeature = await getPostThreadRecursive(user, apObject.object)
  if (postToFeature) {
    postToFeature.featured = true
    await postToFeature.save()
  }
  await signAndAccept({ body: body }, remoteUser, user)
}

export { AddActivity }

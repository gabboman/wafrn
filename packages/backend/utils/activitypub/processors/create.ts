import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { getPostThreadRecursive } from '../getPostThreadRecursive'
import { signAndAccept } from '../signAndAccept'

async function CreateActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  // Create new post
  const postRecived = body.object
  await getPostThreadRecursive(user, postRecived.id, postRecived)
  // await signAndAccept({ body: body }, remoteUser, user)
}

export { CreateActivity }

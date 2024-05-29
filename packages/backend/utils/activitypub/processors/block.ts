import { Blocks } from '../../../db'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { getPostThreadRecursive } from '../getPostThreadRecursive'
import { getRemoteActor } from '../getRemoteActor'
import { signAndAccept } from '../signAndAccept'

async function BlockActivity(body: any, remoteUser: any, user: any) {
  const apObject: activityPubObject = body.object
  const userToBeBlocked = await getRemoteActor(apObject.object, user)
  await Blocks.create({
    remoteId: body.id,
    blockedId: userToBeBlocked.id,
    blockerId: remoteUser.id
  })
  await signAndAccept({ body: body }, remoteUser, user)
}

export { BlockActivity }

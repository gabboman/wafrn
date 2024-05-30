import { Blocks } from '../../../db'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { redisCache } from '../../redis'
import { getPostThreadRecursive } from '../getPostThreadRecursive'
import { getRemoteActor } from '../getRemoteActor'
import { signAndAccept } from '../signAndAccept'

async function BlockActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  const userToBeBlocked = await getRemoteActor(apObject.object, user)
  await Blocks.create({
    remoteBlockId: body.id,
    blockedId: userToBeBlocked.id,
    blockerId: remoteUser.id
  })
  redisCache.del('blocks:mutes:onlyUser:' + userToBeBlocked.id)
  redisCache.del('blocks:mutes:' + userToBeBlocked.id)
  redisCache.del('blocks:mutes:' + userToBeBlocked.id)
  redisCache.del('blocks:' + userToBeBlocked.id)

  await signAndAccept({ body: body }, remoteUser, user)
}

export { BlockActivity }

import { Follows } from '../../../db'
import { environment } from '../../../environment'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { redisCache } from '../../redis'
import { signAndAccept } from '../signAndAccept'

async function AcceptActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body.object
  if (apObject.type === 'Follow' && apObject.id.startsWith(environment.frontendUrl)) {
    const followUrl = apObject.id
    const partToRemove = `${environment.frontendUrl}/fediverse/follows/`
    const follows = followUrl.substring(partToRemove.length).split('/')
    if (follows.length === 2) {
      const followToUpdate = await Follows.findOne({
        where: {
          followerId: follows[0],
          followedId: follows[1]
        }
      })
      if (followToUpdate) {
        followToUpdate.accepted = true
        await followToUpdate.save()
        redisCache.del('follows:full:' + followToUpdate.followerId)
        redisCache.del('follows:notYetAcceptedFollows:' + followToUpdate.followerId)
      }
    }
    signAndAccept({ body: body }, remoteUser, user)
  }
}

export { AcceptActivity }

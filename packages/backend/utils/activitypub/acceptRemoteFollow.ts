import { object } from 'underscore'
import { Follows, User } from '../../models/index.js'
import { completeEnvironment } from '../backendOptions.js'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { postPetitionSigned } from './postPetitionSigned.js'

async function acceptRemoteFollow(userId: string, remoteUserId: string) {
  const localUser = await User.findByPk(userId)
  const remoteUser = await User.findByPk(remoteUserId)
  const followToBeAccepted = await Follows.findOne({
    where: {
      followedId: userId,
      followerId: remoteUserId
    }
  })

  if (localUser && remoteUser && followToBeAccepted) {
    const apObj: activityPubObject = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      actor: completeEnvironment.frontendUrl + '/fediverse/blog/' + localUser.url.toLowerCase(),
      id: `${completeEnvironment.frontendUrl}/fediverse/accept/${encodeURIComponent(
        followToBeAccepted.remoteFollowId
      )}`,
      type: 'Accept',
      object: {
        actor: remoteUser.remoteId,
        id: followToBeAccepted.remoteFollowId,
        object: completeEnvironment.frontendUrl + '/fediverse/blog/' + localUser.url.toLowerCase(),
        type: 'Follow'
      }
    }
    const response = await postPetitionSigned(apObj, localUser, remoteUser.remoteInbox)
    followToBeAccepted.accepted = true
    await followToBeAccepted.save()
    return response
  }
}

export { acceptRemoteFollow }

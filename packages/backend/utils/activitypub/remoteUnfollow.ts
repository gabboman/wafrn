import { completeEnvironment } from '../backendOptions.js'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { postPetitionSigned } from './postPetitionSigned.js'

async function remoteUnfollow(localUser: any, remoteUser: any) {
  const petitionBody: activityPubObject = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${completeEnvironment.frontendUrl}/fediverse/follows/${localUser.id}/${remoteUser.id}/undo`,
    type: 'Undo',
    actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`,
    object: {
      actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`,
      type: 'Follow',
      object: remoteUser.remoteId,
      id: `${completeEnvironment.frontendUrl}/fediverse/follows/${localUser.id}/${remoteUser.id}`
    }
  }
  const followPetition = await postPetitionSigned(petitionBody, localUser, remoteUser.remoteInbox)
  return followPetition
}

export { remoteUnfollow }

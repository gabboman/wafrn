import { completeEnvironment } from '../backendOptions.js'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { postPetitionSigned } from './postPetitionSigned.js'

async function remoteFollow(localUser: any, remoteUser: any) {
  const petitionBody: activityPubObject = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${completeEnvironment.frontendUrl}/fediverse/follows/${localUser.id}/${remoteUser.id}`,
    type: 'Follow',
    actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`,
    object: remoteUser.remoteId
  }
  const followPetition = await postPetitionSigned(petitionBody, localUser, remoteUser.remoteInbox)
  return followPetition
}

export { remoteFollow }

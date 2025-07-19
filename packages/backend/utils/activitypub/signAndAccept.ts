import { completeEnvironment } from '../backendOptions.js'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { User } from '../../models/user.js'
import { postPetitionSigned } from './postPetitionSigned.js'

async function signAndAccept(req: any, remoteUser: User, user: User) {
  const acceptMessage: activityPubObject = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${completeEnvironment.frontendUrl}/fediverse/accept/${encodeURIComponent(req.body.id)}`,
    type: 'Accept',
    actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${(await user).url.toLowerCase()}`,
    object: req.body
  }
  if (remoteUser.remoteInbox === '') {
    throw new Error('Remote inbox is empty')
  }
  return await postPetitionSigned(acceptMessage, await user, await remoteUser.remoteInbox)
}

export { signAndAccept }

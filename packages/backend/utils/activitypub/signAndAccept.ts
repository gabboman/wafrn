import { environment } from '../../environment'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject'
import { postPetitionSigned } from './postPetitionSigned'

async function signAndAccept(req: any, remoteUser: any, user: any) {
  const acceptMessage: activityPubObject = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${environment.frontendUrl}/fediverse/accept/${encodeURIComponent(req.body.id)}`,
    type: 'Accept',
    actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
    object: req.body
  }
  if (remoteUser.remoteInbox === '') {
    throw new Error('Remote inbox is empty')
  }
  return await postPetitionSigned(acceptMessage, await user, await remoteUser.remoteInbox)
}

export { signAndAccept }

//import { getAtProtoThread } from './atproto/utils/getAtProtoThread.js'

import { User } from './db.js'
import { environment } from './environment.js'
import { getRemoteActor } from './utils/activitypub/getRemoteActor.js'
import { MoveActivity } from './utils/activitypub/processors/move.js'

// https://bsky.app/profile/did:plc:daplto33uqatqvce5nrjdwrz/post/3ljtctattrc2i
//await getAtProtoThread('at://did:plc:daplto33uqatqvce5nrjdwrz/app.bsky.feed.post/3ljtctattrc2i', undefined, true)
const localUser = await User.findOne({
  where: {
    email: environment.adminEmail
  }
})
const remoteActor = await getRemoteActor('https://paquita.masto.host/users/Nymeria', localUser)

MoveActivity(
  {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: 'https://paquita.masto.host/users/Nymeria#moves/170',
    type: 'Move',
    target: 'https://neopaquita.es/users/Nymeria',
    actor: 'https://paquita.masto.host/users/Nymeria',
    object: 'https://paquita.masto.host/users/Nymeria'
  },
  remoteActor,
  localUser
)

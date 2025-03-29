//import { getAtProtoThread } from './atproto/utils/getAtProtoThread.js'

import { getAtProtoThread } from './atproto/utils/getAtProtoThread.js'
import { User } from './db.js'
import { environment } from './environment.js'
import { getRemoteActor } from './utils/activitypub/getRemoteActor.js'
import { MoveActivity } from './utils/activitypub/processors/move.js'

// https://bsky.app/profile/did:plc:kcu5gsklhhensnm6vhu6lhq5/post/3lkw3tgtihs23
await getAtProtoThread('at://did:plc:kcu5gsklhhensnm6vhu6lhq5/app.bsky.feed.post/3lljrwzmx522w', undefined, true)

//import { getAtProtoThread } from './atproto/utils/getAtProtoThread.js'

import { Op } from 'sequelize'
import { getAtProtoThread } from './atproto/utils/getAtProtoThread.js'
import { Media, Post, PostTag, Quotes, User } from './models/index.js'
import { environment } from './environment.js'
import { getRemoteActor } from './utils/activitypub/getRemoteActor.js'
import { MoveActivity } from './utils/activitypub/processors/move.js'
import sendActivationEmail from './utils/sendActivationEmail.js'
import { wait } from './utils/wait.js'
import { getAtProtoSession } from './atproto/utils/getAtProtoSession.js'
import { postToAtproto } from './atproto/utils/postToAtproto.js'
import { LdSignature } from './utils/activitypub/rsa2017.js'
import { activityPubObject } from './interfaces/fediverse/activityPubObject.js'
import { Queue } from 'bullmq'
import { getCacheAtDids } from './atproto/cache/getCacheAtDids.js'
import { getAtprotoUser } from './atproto/utils/getAtprotoUser.js'

const cacheDids = await getCacheAtDids(true)
const followedDids = cacheDids.followedUsersLocalIds
console.log(`Need to update ${followedDids.size}`)
const users = await User.findAll({
  where: {
    bskyDid: {
      [Op.in]: Array.from(followedDids)
    }
  }
})

const adminuser = (await User.findOne({
  where: {
    url: environment.adminUser
  }
})) as User
console.log(`starting updates`)
for await (const user of users) {
  console.log(`Updating ${user.url}`)
  await getAtprotoUser(user.url, adminuser)
}

console.log(`update ended`)

import { Op } from 'sequelize'
import { User } from '../../models/user.js'
import { sendUpdateProfile } from '../activitypub/sendUpdateProfile.js'
import { getAtProtoSession } from '../../atproto/utils/getAtProtoSession.js'
import { updateBlueskyProfile } from '../../routes/users.js'

const localUsers = await User.findAll({
  where: {
    email: {
      [Op.ne]: null
    },
    banned: false,
    activated: true
  }
})

console.log(`---- Starting force update of ${localUsers.length} federated profiles ----`)
for await (const user of localUsers) {
  await sendUpdateProfile(user)
  if (user.enableBsky) {
    const bskySession = await getAtProtoSession(user)
    await updateBlueskyProfile(bskySession, user)
  }
}

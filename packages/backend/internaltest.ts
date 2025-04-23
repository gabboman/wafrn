//import { getAtProtoThread } from './atproto/utils/getAtProtoThread.js'

import { Op } from 'sequelize'
import { getAtProtoThread } from './atproto/utils/getAtProtoThread.js'
import { User } from './models/index.js'
import { environment } from './environment.js'
import { getRemoteActor } from './utils/activitypub/getRemoteActor.js'
import { MoveActivity } from './utils/activitypub/processors/move.js'
import sendActivationEmail from './utils/sendActivationEmail.js'
import { wait } from './utils/wait.js'

// https://bsky.app/profile/did:plc:kcu5gsklhhensnm6vhu6lhq5/post/3lkw3tgtihs23
//await getAtProtoThread('at://did:plc:kcu5gsklhhensnm6vhu6lhq5/app.bsky.feed.post/3lljrwzmx522w', undefined, true)

async function sendMail() {
  const users = await User.findAll({
    attributes: ['url', 'email', 'banned', 'activated', 'disableEmailNotifications'],
    where: {
      banned: { [Op.ne]: true },
      activated: true,
      disableEmailNotifications: false,
      email: {
        [Op.ne]: null
      },
      createdAt: {
        [Op.gt]: new Date().setDate(new Date().getDate() - 2)
      }
    },
    order: [['createdAt', 'ASC']]
  })
  console.log('NUMBER OF EMAILS TO SEND: ' + users.length)
  await wait(1500)
  for await (const user of users) {
    const subject = `Hello ${user.url}! Your wafrn account was activated!`
    const body = `Hello ${user.url}, your account has been reviewed by our team and is now activated! If you already got this email twice apologies, we got an issue with the email provider and we had to resend a few :(`
    console.log(`mailing ${user.url}`)
    await sendActivationEmail(user.email, '', subject, body)
    await wait(1500)
  }
}

sendMail()

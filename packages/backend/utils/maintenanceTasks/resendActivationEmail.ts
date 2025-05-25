import { Op } from 'sequelize'
import { User } from '../../models/index.js'
import { wait } from '../wait.js'
import { environment } from '../../environment.js'

const usersNotVerified = await User.findAll({
  where: {
    activated: false,
    emailVerified: false,
    banned: false,
    email: {
      [Op.ne]: null
    }
  }
})

console.log(`Not verified users: ${usersNotVerified.length}`)
await wait(500)
for await (const user of usersNotVerified.filter((elem) => !!elem)) {
  console.log(`Sending email to user ${user.url} with email ${user.email}`)
  const mailHeader = `Helo ${environment.instanceUrl}, your email is still not verified!`
  const mailBody = `<h1>We maaaay have commited a small whoopsie on ${
    environment.instanceUrl
  } regarding the previous email verification email</h1>
  <p>Please click here to verify your email <a href="${environment.instanceUrl}/activate/${encodeURIComponent(
    user.email as string
  )}/${user.activationCode}">click here!</a>. If you can not see the link correctly please copy this link:
              ${environment.instanceUrl}/activate/${encodeURIComponent((user.email as string).toLowerCase())}/${
    user.activationCode
  }
             </p> 
             <p>And by "may" we mean for sure. Please do reply to this email if you did and we dont get back to you in 24 hours</p>`
  const emailSent = await wait(2500)
}

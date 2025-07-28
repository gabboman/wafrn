import { Op } from 'sequelize'
import { Notification, User } from '../../models/index.js'
import { wait } from '../wait.js'
import sendActivationEmail from '../sendActivationEmail.js'
import getBlockedIds from '../cacheGetters/getBlockedIds.js'
import { getMutedPosts } from '../cacheGetters/getMutedPosts.js'
import { getNotificationOptions } from '../../routes/notifications.js'
import { completeEnvironment } from '../backendOptions.js'

async function sendMail() {
  const users = await User.findAll({
    where: {
      banned: { [Op.ne]: true },
      activated: true,
      disableEmailNotifications: false,
      email: {
        [Op.ne]: null
      }
    },
    order: [['createdAt', 'ASC']]
  })

  for await (const user of users) {
    if (!user.email) {
      continue
    }
    const blockedUsers = await getBlockedIds(user.id, false)
    const startCountDate = user?.lastTimeNotificationsCheck
    const mutedPostIds = (await getMutedPosts(user.id)).concat(await getMutedPosts(user.id, true))
    const notificationsCount = await Notification.count({
      where: {
        notifiedUserId: user.id,
        [Op.or]: [await getNotificationOptions(user.id)],
        postId: {
          [Op.or]: [
            {
              [Op.notIn]: mutedPostIds?.length ? mutedPostIds : ['00000000-0000-0000-0000-000000000000']
            },
            {
              [Op.eq]: null
            }
          ]
        },
        userId: {
          [Op.notIn]: blockedUsers.concat([user.id])
        },
        createdAt: {
          [Op.gt]: startCountDate
        }
      }
    })
    const subject = `New wafrn feature: follow tags, the homestuck update! ${user.url} come back. Its realy cool. You have ${notificationsCount} notifications btw`
    const body = `
    <h1>${user.url}, We miss you at <a href="https://app.wafrn.net">wafrn</a>!</h1>
    <p>As you can see, other people also misses you, as you have ${notificationsCount} unread notifications!</p>
    ${
      notificationsCount == 0
        ? '<p>Wow, zero. You should come back and make this number bigger next time we send you an email</p>'
        : ''
    }
<br />
So some of the changelog for last month:
<ul>
	<li>FOLLOW TAGS. Wafrn is now the perfect place for homestuck for some reason, as we get all posts from bluesky with homestuck. What a mistery</li>
  <li>Improved bluesky integration: now you can log in into your bluesky account hosted in wafrn! (this one is very janky but that has never stopped us)</li>
	<li>Updated the UI a lot on mobile!</li>
	<li>Replace AI with cocaine</li>
	<li>Performance improvements</li>
	<li>We have added a delete account button. No longer asking on a email to a mod to nuke your account. Sorry for that one!</li>
	<li>DOOM is still working</li>
	<li>We have added new bugs</li>
</ul>
And finaly, the part of the email where I say "give me money". Well, first, give money to the team, and then me

<ul>
	<li><a href="https://social.sztupy.hu/blog/sztupy" target="_blank">SztupY</a> has helped to create a wafrn hosting guide and streamlined the process a lot. You should give <a href="https://ko-fi.com/SztupY" target="_blank">SztupY</a> some money. Also yes his profile is not on the main wafrn!</li>
	<li><a href="https://ko-fi.com/juandjara" target="_blank">Javascript</a> made <a href="https://wafrn.net/" target="_blank">the mobile app</a>, its realy cool</li>
	<li><a href="https://ko-fi.com/cyrneko/tiers" target="_blank">Alexia</a> has helped improve the quality of the code and made the way for other improvements. She has done a lot to help wafrn grow</li>
	<li>And finaly... we have to link the wafrn <a href="https://patreon.com/wafrn" target="_blank">patreon</a> and <a href="https://ko-fi.com/wafrn" target="_blank">kofi</a>. This money goes to gabbo for fried chicken and to the wafrn servers. Give me money! please :3</li>
</ul>

<p>If you no longer desire to get these emails, please <a href="${
      completeEnvironment.frontendUrl
    }/api/disableEmailNotifications/${user.id}/${user.activationCode}">click here</a>.</p>
<p>Apologies if last time link did not work. Sorry</p>
    `
    console.log(`mailing ${user.url}`)
    await sendActivationEmail(user.email, '', subject, body)
    await wait(1500)
  }
}

sendMail()

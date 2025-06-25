import { Op } from 'sequelize'
import { Notification, User } from '../../models/index.js'
import { wait } from '../wait.js'
import sendActivationEmail from '../sendActivationEmail.js'
import getBlockedIds from '../cacheGetters/getBlockedIds.js'
import { getMutedPosts } from '../cacheGetters/getMutedPosts.js'
import {getNotificationOptions } from '../../routes/notifications.js'
import { environment } from '../../environment.js'

async function sendMail() {
  const users = await User.findAll({
    where: {
      url: 'admin',
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
    const subject = notificationsCount != 0 ? `Hello ${user.url}, you have ${notificationsCount} unread notifications in wafrn!` : `Hello ${user.url}, you have ${notificationsCount} unread notifications in wafrn! Wow thats zero notifications`
    const body = `
    <h1>${user.url}, We miss you at <a href="https://app.wafrn.net">wafrn</a>!</h1>
    <p>As you can see, other people also misses you, as you have ${notificationsCount} unread notifications!</p>
    We added a few emojis of waffy made by blakeana_00. <a href="https://ko-fi.com/c/96311eda24">You can comission him new emojis!</a><br />
<a href="https://ko-fi.com/c/96311eda24"><img alt="" src="https://media.wafrn.net/1750800172033_31a8ffb58f2a8ca5d67e3992c94a1da8815c6c5d_processed.webp" style="width: 100%;" /></a><br />
<br />
<br />
So some of the changelog for last few months:
<ul>
	<li>A cool mascot</li>
	<li>A cool emoji pack for every wafrn instance by&nbsp;blakeana_00</li>
	<li>Replace AI with cocaine</li>
	<li>Performance improvements</li>
	<li>Migrations OUT of wafrn working! Your account is not attached to us! You can move your wafrn account to any other fedi server!</li>
	<li>We have migrations from the fedi to wafrn working! You can move your mastodon/*oma/*key account to wafrn!</li>
	<li>We have added a delete account button. No longer asking on a email to a mod to nuke your account. Sorry for that one!</li>
	<li>Added herobrine</li>
	<li>We have fixed a lot of bugs</li>
	<li>We have fixed some bugs that you havent seen because they were new and they were fixed quickly!</li>
	<li>Self hosting wafrn is now more viable!</li>
</ul>
And finaly, the part of the email where I say "give me money". Well, first, give money to the team, and then me

<ul>
	<li><a href="https://social.sztupy.hu/blog/sztupy" target="_blank">SztupY</a> has helped to create a wafrn hosting guide and streamlined the process a lot. You should give <a href="https://ko-fi.com/SztupY" target="_blank">SztupY</a> some money. Also yes his profile is not on the main wafrn!</li>
	<li><a href="https://ko-fi.com/juandjara" target="_blank">Javascript</a> made <a href="https://wafrn.net/" target="_blank">the mobile app</a>, its realy cool</li>
	<li><a href="https://ko-fi.com/cyrneko/tiers" target="_blank">Alexia</a> has helped improve the quality of the code and made the way for other improvements. She has done a lot to help wafrn grow</li>
	<li>And finaly... we have to link the wafrn <a href="https://patreon.com/wafrn" target="_blank">patreon</a> and <a href="https://ko-fi.com/wafrn" target="_blank">kofi</a>. This money goes to gabbo for fried chicken and to the wafrn servers. Give me money! please :3</li>
</ul>

<p>If you no longer desire to get these emails, please <a href="${environment.frontendUrl}/disableEmailNotifications/${user.id}/${user.activationCode}">click here</a>.</p>
    `
    console.log(`mailing ${user.url}`)
    await sendActivationEmail(user.email, '', subject, body)
    await wait(1500)
  }
}

sendMail()

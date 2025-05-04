import { Op } from 'sequelize'
import { User } from '../../models/index.js'
import { wait } from '../wait.js'
import sendActivationEmail from '../sendActivationEmail.js'

async function sendMail() {
  const users = await User.findAll({
    attributes: ['url', 'email', 'banned', 'activated', 'disableEmailNotifications'],
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
    const subject = `We have fixed jank at wafrn. We have also added more jank to wafrn!`
    const body = `
    <h1>Hello ${user.url}!</h1>
<a  target="_blank" href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>Ok so you clicked, that's good. Lets get into it!</p>
<p>We have been doing lots of improvements! Bluesky integration? faster and less janky! Things? better. Users? more!</p>
<p>First of all, we have fixed a bug that didnt allow users to delete rewoots. That one was annoying!</p>
<p>We also have introduced a few new bugs and fixed them! As example when editing a post attached medias got deleted. Not anymore!</p>
<p>There are a lot of cool new options. Options like hiding who you follow and who follows you, options to hide notifications of people you dont follow, and notification filtering!</p>
<h2>Come back to <a  target="_blank" href="https://app.wafrn.net">wafrn</a>, we miss you!</h2>
<p>The wafrn team has grown up, its a lot more than just gabboman... Thats why, in the part of these emails where I said "give me money", I am going to say "give money to the team!"</p>
<ul>
<li><a target="_blank" href="https://social.sztupy.hu/blog/sztupy">SztupY</a> has helped to create a wafrn hosting guide and streamlined the process a lot. You should give <a target="_blank" href="https://ko-fi.com/SztupY">SztupY</a> some money. Also yes his profile is not on the main wafrn!
<li><a target="_blank" href="https://ko-fi.com/juandjara">Javascript</a> made <a target="_blank" href="https://wafrn.net/">the mobile app</a>, its realy cool </li>
<li><a target="_blank" href="https://ko-fi.com/cyrneko/tiers">Alexia</a> has helped improve the quality of the code and made the way for other improvements. She has done a lot to help wafrn grow</li>
<li><a target="_blank" href="https://ko-fi.com/fireisgood">FireIsGood</a> made lots of small improvements to wafrn over christmas!</li>
<li><a target="_blank" href="https://ko-fi.com/campos02">Campos</a> helped by doing some fixes to the bluesky integration of wafrn! Our first version had some issues and this one... has less issues!</li>
<li>For no particular reason, help a friend pay his HRT, get a cool sealsona at a very good price by <a target="_blank" href="https://app.wafrn.net/fediverse/post/ebc7daf3-2b5f-4780-901a-bd29939ce77c">clicking here!</a></li>
<li>And finaly... we have to link the wafrn <a target="_blank" href="https://patreon.com/wafrn">patreon</a> and <a target="_blank" href="https://ko-fi.com/wafrn">kofi</a>. This money goes to gabbo for fried chicken and to the wafrn servers</li>

    `
    console.log(`mailing ${user.url}`)
    await sendActivationEmail(user.email, '', subject, body)
    await wait(1500)
  }
}

sendMail()

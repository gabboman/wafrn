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
    if (!user.email)
      continue;

    const subject = `Wafrn monthly propaganda for ${user.url}! More themes! More jank! More herobrine!`
    const body = `
    <h1>Hello ${user.url}!</h1>
<a  target="_blank" href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>Ok so you clicked, that's good. Lets get into it!</p>
<p>We have been doing lots of improvements! Bluesky integration? faster and less janky! Things? better. Users? more!</p>
<p>Alexia made us a really cool temporal (or permanent who knows) landing page! Go share the wafrn page project with your enemies or take a look to it here! <a href="www.wafrn.net">www.wafrn.net</a></p>
<p>Some of the custom themes include a WINDOWS 98 theme, a wafrnverse theme and stuff.</p>
<h2>Come back to <a  target="_blank" href="https://app.wafrn.net">wafrn</a>, we miss you!</h2>
<p>The wafrn team has grown up, its a lot more than just gabboman... Thats why, in the part of these emails where I say "give me money" instead of that, I am going to say "give money to the team!"</p>
<ul>
<li><a target="_blank" href="https://ko-fi.com/juandjara">Javascript</a> made <a target="_blank" href="https://app.wafrn.net/fediverse/post/271626cb-660a-412f-92a9-55faa6ebc89a">the mobile app</a>, its realy cool </li>

<li><a target="_blank" href="https://ko-fi.com/cyrneko/tiers">Alexia</a> has helped improve the quality of the code and made the way for other improvements. She has done a lot to help wafrn grow</li>
<li><a target="_blank" href="https://ko-fi.com/mondori">Alexander</a> not only did the "fan theme" but he also is the person who I comissioned our logo. You can donate to him <a target="_blank" href="https://ko-fi.com/mondori">here</a> or you <a target="_blank" href="https://app.wafrn.net/blog/@mondori_art@delen.2ezelf.net">could comission him some art!</a></li>
<li><a target="_blank" href="https://ko-fi.com/fireisgood">FireIsGood</a> made lots of small improvements to wafrn over christmas!</li>
<li><a target="_blank" href="https://ko-fi.com/motivatedtomato">motivatedtomato</a> helped by creating the WAFRNVERSE theme, inspired by nintendoo's miiverse style!</li>
<li><a target="_blank" href="https://ko-fi.com/campos02">Campos</a> helped by doing some fixes to the bluesky integration of wafrn! Our first version had some issues and this one... has less issues!</li>
<li>And finaly... we have to link the wafrn <a target="_blank" href="https://patreon.com/wafrn">patreon</a> and <a target="_blank" href="https://ko-fi.com/wafrn">kofi</a>. You can also give me money but if you can, go help other people who also makes wafrn a very good place!</li>

    `
    console.log(`mailing ${user.url}`)
    await sendActivationEmail(user.email, '', subject, body)
    await wait(1500)
  }
}

sendMail()

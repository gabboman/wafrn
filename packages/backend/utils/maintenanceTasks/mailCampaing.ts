import { Op } from 'sequelize'
import { User } from '../../db.js'
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
    const subject = `Hey ${user.url}, have you heard of bluesky? Would you like to use it to follow artists of it... from wafrn?`
    const body = `
    <h1>What's up ${user.url}?</h1>
<a href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>We have made a <del>nothing at all</del> quite a few things to <a href="https://app.wafrn.net" target="_blank">wafrn</a>! Not only the bluesky thing, but some cool stuff!</p>
<p>Some friends have helped me and now we have a LIGHT THEME, a BASIC THEME SELECTOR, and a VERY IMPROVED UI. Again. We have changed it a bit. To better!</p>
<p>Regarding bluesky, you need to dm @gabboman so he can enable bluesky for your account, as some details are still <a href="https://app.wafrn.net/fediverse/post/5a058af2-fc8a-4d36-8edd-36faecafb250" target="_blank">a bit janky in some parts</a></p>
<p>But if you feel like you wanna see some cool artists, its totaly worth it! There is <a href="https://app.wafrn.net/fediverse/post/fe6ef464-4987-446b-bf42-9879eebcbe9f" target="_blank">raxdflipnote</a> and  <a href="https://app.wafrn.net/fediverse/post/ad855e93-1476-4b0f-9f75-38c10836cd04" target="_blank">gaz</a></p>
<p>And finaly, if you have one spare buck, give it to me! I want to invite my wife to a pizza. We have <a href="https://patreon.com/wafrn">patreon</a> and <a href="https://ko-fi.com/wafrn">ko-fi</a>. You dont have to, but it would be cool</p>
<h2>Come back to <a href="https://app.wafrn.net">wafrn</a>, we miss you!</h2>
<p>(Columbo voice): Oh, a just final thing, <a href="https://app.wafrn.net/fediverse/post/b574e933-0485-43ef-9a4e-c20f4d0a34ae">someone is working on an app</a></p>
    `
    console.log(`mailing ${user.url}`)
    await sendActivationEmail(user.email, '', subject, body)
    await wait(2000)
  }
}

sendMail()

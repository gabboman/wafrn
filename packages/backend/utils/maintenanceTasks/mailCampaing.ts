import { Op } from 'sequelize'
import { User } from '../../db'
import { wait } from '../wait'
import sendActivationEmail from '../sendActivationEmail'

async function sendMail() {
  const users = await User.findAll({
    attributes: ['url', 'email'],
    where: {
      banned: { [Op.ne]: true },
      activated: true,
      disableEmailNotifications: false,
      url: {
        [Op.notLike]: '%@%'
      }
    },
    order: [['createdAt', 'ASC']]
  })

  for await (const user of users) {
    const subject = `Hello ${user.url}, we have updated the interface. AGAIN! Now is rounded and bubbly`
    const body = `
    <h1>What's up ${user.url}, hope all is ok and going very evil-ly!</h1>
<p>We have made a huge update to <a href="https://app.wafrn.net" target="_blank">wafrn</a>, and other cool stuff</p>
<a href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>Do not worry about your theme! This time, unlike on christmas, old themes will still be working! Think of this update of a new base theme!</p>
<p>We have a new feature too! This one please read the whole pagraph before you get angry!</p>
<p>You may know of threads, meta/facebook fediverse software. Well, <b>if you chose</b>, you can federate with them. You have to activate it in your settings to be able to follow people in threads. If you dont chose to, is like wafrn had them blocked. Your information is safe from them</p>
<p>There are good reasons both to not want to federate with them and to do it. But making this opt out would be disrispecting you.</p>
<p>Also, if you have one spare buck, give it to me! I want to invite my wife to a pizza. We have <a href="https://patreon.com/wafrn">patreon</a> and <a href="https://ko-fi.com/wafrn">ko-fi</a>. You dont have to, but it would be cool</p>
<h6>Attention, we might go for something healthier instead of pizza</h6>
<h2>Come back to <a href="https://app.wafrn.net">wafrn</a>, we miss you!</h2>
    `
    console.log(`mailing ${user.url}`)
    await sendActivationEmail(user.email, '', subject, body)
    await wait(5000)
  }
}

sendMail()

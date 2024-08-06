import { Op } from 'sequelize'
import { User } from '../../db'
import { wait } from '../wait'
import sendActivationEmail from '../sendActivationEmail'

async function sendMail() {
  const users = await User.findAll({
    attributes: ['url', 'email', 'banned', 'activated', 'disableEmailNotifications'],
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
    const subject = `Hello ${user.url}, you now can set your account to manually accept new followers! Also minecraft server`
    const body = `
    <h1>What's up ${user.url}?</h1>
<p>We have made a huge update to <a href="https://app.wafrn.net" target="_blank">wafrn</a>! Now you can set your account to manually accept new follow requests! And not only that, you can remove people who you did not want to follow you in the first place!</p>
<a href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<img src="https://media.wafrn.net/1722976767875_0df27e8ad3c5057cd578d3376d9815ea6ca26a0e.webp" />
<p>We have also updated the post view! Now you can see replies to your dearranged posts in a more easy way!</p>
<img src="https://media.wafrn.net/1722976907776_f95f6a00fa74b34df7ded82f915909afcad30abc.webp" />
<p>Oh, almost forgot, as you can see we also have another minecraft server. Go join app.wafrn.net, you can use bedrock or java. Do not worry, its compatible with old versions and modern ones! :D</p>
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

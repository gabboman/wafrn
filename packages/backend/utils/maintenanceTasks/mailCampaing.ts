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
    const subject = `Hello ${user.url}, we would like to ASK you about a new feature...`
    const body = `
    <h1>What's up ${user.url}?</h1>
<p>We have made a huge update to <a href="https://app.wafrn.net" target="_blank">wafrn</a>! Now you can do ASKS! You can enable anons too in your profile settings!</p>
<a href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>New cool button!</p>
<img style="width:100%" src="https://media.wafrn.net/1724617882050_ffb640d7272ffe73ba7eee8edbd121a5775781f6.avif" />
<p>By default its only from logged in users. In the near future you will be able to recive asks from the fediverse with some dark magic on my side</p>
<p >We have worked very hard! Come back, enable anons if thats your thing and send your profile to your friends!</p>
<img style="width:100%"  src="https://media.wafrn.net/1724617878850_a8ece1d9a501241bc7049022da9160c80d76538c.avif" />
<p>Oh, almost forgot, as you can see we also have another minecraft server. Go join minecraft.wafrn.net (the ip has changed sorry), you can use bedrock or java. Do not worry, its compatible with old versions and modern ones! :D</p>
<p>Also, if you have one spare buck, give it to me! I want to invite my wife to a pizza. We have <a href="https://patreon.com/wafrn">patreon</a> and <a href="https://ko-fi.com/wafrn">ko-fi</a>. You dont have to, but it would be cool</p>
<h2>Come back to <a href="https://app.wafrn.net">wafrn</a>, we miss you!</h2>
    `
    console.log(`mailing ${user.url}`)
    await sendActivationEmail(user.email, '', subject, body)
    await wait(2000)
  }
}

sendMail()

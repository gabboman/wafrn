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
    const subject = `Hello ${user.url}, we have a new editor, new bugs!`
    const body = `
    <h1>What's up ${user.url}?</h1>
<a href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>We have made a <del>huge</del> <del>gay</del> <del>very boring</del> medium sized update to <a href="https://app.wafrn.net" target="_blank">wafrn</a>! Now we have a new editor! It will not have the same bugs as the old one, but you can still force the old one in your profile settings :D</p>
<img style="width:100%" src="https://cdn.wafrn.net/api/cache/?media=https%3A%2F%2Fmedia.wafrn.net%2F1726853570174_57660afcdf8571e15f5643ebc8466d5ab22224e6.avif" />
<p>I would like to remind you that we also have asks :DDDDD</p>
<img style="width:100%"  src="https://media.wafrn.net/1724617878850_a8ece1d9a501241bc7049022da9160c80d76538c.avif" />
<p>Oh, almost forgot, as you can see we also have another minecraft server. Go join minecraft.wafrn.net (the ip has changed sorry), you can use bedrock or java. Do not worry, its compatible with old versions and modern ones! :D</p>
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

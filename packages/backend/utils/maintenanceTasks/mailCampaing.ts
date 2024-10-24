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
      url: {
        [Op.notLike]: '%@%'
      }
    },
    order: [['createdAt', 'ASC']]
  })

  for await (const user of users) {
    const subject = `Hey ${user.url}, we have made wafrn even faster!`
    const body = `
    <h1>What's up ${user.url}?</h1>
<a href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>We have made a <del>very boring</del> normal sized update to <a href="https://app.wafrn.net" target="_blank">wafrn</a>! We are adding </p>
<p>There are no pictures of this because it moves too fast and I cant show it to you</p>
<p>I would also like to remind you that we also have asks :DDDDD</p>
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

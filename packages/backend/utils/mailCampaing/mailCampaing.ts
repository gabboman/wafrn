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
      url: {
        [Op.notLike]: '%@%'
      }
    },
    order: [['createdAt', 'ASC']]
  })

  for await (const user of users) {
    const subject = `Hello ${user.url}, wafrn now has A NEW LOGO!`
    const body = `
    <h1>What's up ${user.url}, hope all is ok and going evil-ly!😀</h1>
<p>We have made a huge update to <a href="https://app.wafrn.net" target="_blank">wafrn's logo</a>, and a lot of other neew cool stuff</p>
<a href="https://app.wafrn.net"><img src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>Do not worry, if you dislike the new logo, going to edit profile you can force the classical logo!</p>
<p>We have some new features too! You can now ADD SPECIAL EMOJIS TO YOUR NAME, from silly blobcats to pride flags!</p>
<a href="https://app.wafrn.net"><img src="https://media.wafrn.net/1714818722900_e0e9a53bc16569d2e68607a3622bae54f368c39c.webp"/> </a>
<p>And you can also see and do EMOJIREACTS too! You can react with these special emojis to posts! Not only likes.</p>
<a href="https://app.wafrn.net"><img src="https://media.wafrn.net/1714818809248_714f6e4f7f0aec9a74ab2e20d23772b0f1439461.webp"/> </a>
<h6>disclaimer: some users might not be able to see emojireacts, specially if they use mastodon.</h6>
<p>You can also do quoteposts on public posts! This allows for some new interactions</p>
<a href="https://app.wafrn.net"><img src="https://media.wafrn.net/1714818979251_676d42ec29d35090f3f28faa9a0687431a1dd725.webp" /> </a>
<p>We have been working lately a lot in wafrn. Come back, we have cool stuff.</p>
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

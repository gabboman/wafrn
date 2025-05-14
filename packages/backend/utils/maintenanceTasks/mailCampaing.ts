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
    if (!user.email) {
      continue
    }
    const subject = `We moved our server from France to Amsterdam! Sorry for two emails in the same month!`
    const body = `
    <h1>Hello ${user.url}!</h1>
<a  target="_blank" href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>Remember to put something funy and then attach snazzypurpleman image do not leave this text on the next campaign but do leave the image</p>
<a href="https://app.wafrn.net/fediverse/post/b4529df6-7567-40d8-b97c-5e7251341b11" target="_blank><img style="width:100%" src="https://media.wafrn.net/1747230486580_3f20adffb3717316b4531fa80ccab363e2ddbbe9_processed.webp"></a>
<p>We did a <a href="https://app.wafrn.net/fediverse/post/f6a643dc-4f7d-439b-8bb9-39cf1ac08439" target="_blank">"please give me money for a new server"</a>  yesterday and as you can see for the thread!</p>
<p>20€ is the amount of money we needed for the server, and we got it! Yep, more or less thats what hosting wafrn costs! And if you check the patreon you'll see its more than enough right now. But we needed to have the new machine at the same time than the other ones, hence why we asked for moneys</p>
<p>The wafrn team has grown up, its a lot more than just gabboman... Thats why, in the part of these emails where I said "give me money", I am going to say "give money to the team!"</p>
<ul>
<li><a target="_blank" href="https://social.sztupy.hu/blog/sztupy">SztupY</a> has helped to create a wafrn hosting guide and streamlined the process a lot. You should give <a target="_blank" href="https://ko-fi.com/SztupY">SztupY</a> some money. Also yes his profile is not on the main wafrn!
<li><a target="_blank" href="https://ko-fi.com/juandjara">Javascript</a> made <a target="_blank" href="https://wafrn.net/">the mobile app</a>, its realy cool </li>
<li><a target="_blank" href="https://ko-fi.com/cyrneko/tiers">Alexia</a> has helped improve the quality of the code and made the way for other improvements. She has done a lot to help wafrn grow</li>
<li><a target="_blank" href="https://ko-fi.com/fireisgood">FireIsGood</a> made lots of small improvements to wafrn over christmas!</li>
<li><a target="_blank" href="https://ko-fi.com/campos02">Campos</a> helped by doing some fixes to the bluesky integration of wafrn! Our first version had some issues and this one... has less issues!</li>
<li>And finaly... we have to link the wafrn <a target="_blank" href="https://patreon.com/wafrn">patreon</a> and <a target="_blank" href="https://ko-fi.com/wafrn">kofi</a>. This money goes to gabbo for fried chicken and to the wafrn servers</li>

    `
    console.log(`mailing ${user.url}`)
    await sendActivationEmail(user.email, '', subject, body)
    await wait(1500)
  }
}

sendMail()

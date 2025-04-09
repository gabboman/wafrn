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
    const subject = `Wafrn had A LOT of updates ${user.url}! We have a beta app with notifications, an updated editor, updated themes, updated features!`
    const body = `
    <h1>Hello ${user.url}!</h1>
<a  target="_blank" href="https://app.wafrn.net"><img style="width:100%" src="https://app.wafrn.net/assets/logo.png" /> </a>
<p>Ok so you clicked, that's good. Lets get into it!</p>
<p>Our friend <a  target="_blank" href="https://app.wafrn.net/blog/javascript">@javascript</a> made a phone app! The app is still not avaiable on the main stores, but you can download the beta <a  target="_blank" href="https://app.wafrn.net/fediverse/post/271626cb-660a-412f-92a9-55faa6ebc89a">here</a> and help us test it! Both for android and iphone!</p>
<p>It was hard, but we also got notifications working in the app :D</p>
<p>Also, <a  target="_blank" href="https://app.wafrn.net/blog/alexia">@Alexia</a> updated the editor on mobile and pc, making it a bit cooler!</p>
<img style="max-width:80%" src="https://media.wafrn.net/1740672391733_262acc362f688a440ce332c5cc2a54060f661df0_processed.webp"/>
<p>Between <a  target="_blank" href="https://app.wafrn.net/blog/alexia">@Alexia</a> and <a  target="_blank" href="https://app.wafrn.net/blog/FireIsGood">@FireIsGood</a> we got custom default themes! And thanks to <a  target="_blank" href="https://app.wafrn.net/blog/nugget">Alex</a> one of them is inspired by a website that you may be familiar with! Log in to wafrn and select... THE FAN THEME</p>
<img style="max-width:80%" src="https://media.wafrn.net/1740672651944_b1b0f9de881c02dea78495983a7c0d7faa02561c_processed.webp" />
<p> Take a look at the FAN THEME!!</p>
<img style="width:100%" src="https://media.wafrn.net/1740518367034_6d01f8f48cc374399405569680e8a1d759f7d63e_processed.webp" />
<p>Ok this was cool right?</p>
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

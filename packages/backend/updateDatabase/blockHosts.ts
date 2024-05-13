import axios from 'axios'
import { environment } from '../environment'
import { FederatedHost, User, sequelize } from '../db'
//const { csv } = require("csv-parse");

async function blockHosts() {
  const ignoreHostsList = environment.ignoreBlockHosts
  const deletedUser = environment.forceSync
    ? undefined
    : await User.findOne({
        where: {
          url: environment.deletedUser
        }
      })
  const remoteData = await axios.get(environment.blocklistUrl)
  console.log('remote data obtained')
  const hostLines: string[] = remoteData.data.split('\n')
  //hostLines.forEach(async (line, index) => {
  let index = 0
  console.log('initiating marking of problematic hosts')
  for await (const line of hostLines) {
    if (index !== 0) {
      const urlToBlock = line.split(',')[0]
      if (!ignoreHostsList.includes(urlToBlock)) {
        const hostToBlock = await FederatedHost.findOne({
          where: {
            displayName: urlToBlock
          }
        })
        if (hostToBlock) {
          hostToBlock.blocked = true
          hostToBlock.updatedAt = new Date()
          await hostToBlock.save()
        } else {
          const tmp = await FederatedHost.create({
            displayName: urlToBlock,
            blocked: true
          })
          console.log(tmp.displayName)
        }
      } else {
        console.log(`sparint ${urlToBlock}`)
      }
    }
    index = index + 1
  }
  console.log('initiating removal of users from problematic hosts')
  // we remove the problematic users posts in a big sweep
  /*
  const stringSelectBadUsers =
    'SELECT id from users where federatedHostId IN (SELECT id from federatedHosts where blocked = TRUE)'
  // we remove posts from problematic instances
  let result = await sequelize.query(
    `UPDATE posts set content="Post has been deleted because instance was in the blacklist", userId="${
      deletedUser.id ? deletedUser.id : ''
    }" where userId in (${stringSelectBadUsers})`
  )
  */
  // we remove follows from these users
  //result = await sequelize.query(`DELETE from follows where followerId in (${stringSelectBadUsers})`)
  //result = await sequelize.query(`DELETE from follows where followedId in (${stringSelectBadUsers})`)
  // we remove mentions and likes to those users in db
  //result = await sequelize.query(`DELETE from postMentionsUserRelations where userId in (${stringSelectBadUsers})`)
  //result = await sequelize.query(`DELETE from userLikesPostRelations where userId in (${stringSelectBadUsers})`)
  // we delete the evil users medias
  //result = await sequelize.query(`DELETE from medias where userId in (${stringSelectBadUsers})`)
  // we delete the users
  //result = await sequelize.query(`DELETE from users where id in (${stringSelectBadUsers})`)
  console.log('cleanup done')
}

blockHosts()
  .then(() => {
    console.log('done')
  })
  .catch((error) => {
    console.error(error)
  })

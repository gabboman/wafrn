import { Op } from 'sequelize'
import { FederatedHost, User } from '../../models/index.js'
import { removeUser } from '../activitypub/removeUser.js'

async function nukeUsersFromBlockedHosts() {
  const blockedHosts = await FederatedHost.findAll({
    where: {
      blocked: true
    }
  })

  const usersToDelete = await User.findAll({
    where: {
      federatedHostId: {
        [Op.in]: blockedHosts.map((elem: any) => elem.id)
      }
    }
  })
  for await (const user of usersToDelete) {
    console.log(`Nuking ${user.url}`)
    await removeUser(user.id)
  }
}

nukeUsersFromBlockedHosts().then(() => {
  console.log('nuked')
})

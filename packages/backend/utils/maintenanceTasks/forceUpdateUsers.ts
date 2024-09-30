import { Job, Queue } from 'bullmq'
import { Op } from 'sequelize'
import _ from 'underscore'
import { FederatedHost, User } from '../../db.js'
import { environment } from '../../environment.js'
import { getRemoteActorIdProcessor } from '../queueProcessors/getRemoteActorIdProcessor.js'

let adminUser = User.findOne({
  where: {
    url: environment.adminUser
  }
})

async function updateAllUsers() {
  console.log('lets a update all users that we caaaaaaaaan')
  adminUser = await adminUser

  const allRemoteUsers = await User.findAll({
    order: [['updatedAt', 'ASC']],
    include: [
      {
        model: FederatedHost,
        where: {
          blocked: false
        }
      }
    ],
    where: {
      banned: false,
      url: {
        [Op.like]: '@%@%'
      },
      updatedAt: {
        // there are some old users that havent been updated in ages and could be deleted. will need fix later
        [Op.gt]: new Date().setFullYear(2001)
      }
    }
  })

  for await (const chunk of _.chunk(allRemoteUsers, 50)) {
    console.log('chunk started')
    console.log(chunk[0].url)
    await processChunk(chunk)
    console.log('chunk finished')
  }
  console.log('------FINISHED-----')
}

async function processChunk(users: any[]) {
  const promises = users.map(async (actor: any) =>
    getRemoteActorIdProcessor({
      data: { actorUrl: actor.remoteId, userId: (await adminUser).id, forceUpdate: true }
    } as Job)
  )
  try {
    await Promise.allSettled(promises)
  } catch (error) {
    console.log('error in one of the chonks')
  }
}

updateAllUsers()

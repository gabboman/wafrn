import { FederatedHost, User } from '../db'
import { Job, Queue } from 'bullmq'
import { environment } from '../environment'
import { Op } from 'sequelize'
import { getRemoteActorIdProcessor } from './queueProcessors/getRemoteActorIdProcessor'
import { all } from 'axios'
import _ from 'underscore'

let adminUser = User.findOne({
  where: {
    url: environment.adminUser
  }
})

async function updateAllUsers() {
  console.log('lets a update all users that we caaaaaaaaan')
  adminUser = await adminUser;
  
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
      remoteMentionUrl: {
        [Op.eq]: null
      },
      url: {
        [Op.like]: '@%@%'
      }
    }
  })
  
  for await (const chunk of _.chunk(allRemoteUsers, 50)) {
    console.log('chunk started')
    await processChunk(chunk)
    console.log('chunk finished')
  }
  console.log('------FINISHED-----')
}

async function processChunk(users: any[]) {
  const promises = users.map(async (actor: any) => getRemoteActorIdProcessor({
    data: { actorUrl: actor.remoteId, userId: (await adminUser).id, forceUpdate: true }
  } as Job))
  try {
    await Promise.allSettled(promises)
  } catch (error) {
    console.log('error in one of the chonks')
  }
  
}

updateAllUsers()

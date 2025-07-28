import { Queue } from 'bullmq'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { FederatedHost, sequelize, User } from '../../models/index.js'
import { completeEnvironment } from '../backendOptions.js'
import { userToJSONLD } from './userToJSONLD.js'
import { Op } from 'sequelize'
import { redisCache } from '../redis.js'

const lowPriorityQueue = new Queue('deletePostQueue', {
  connection: completeEnvironment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: true
  }
})

async function sendUpdateProfile(user: User) {
  await redisCache.del('fediverse:user:base:' + user.id)
  const userObjectData = await userToJSONLD(user)
  delete userObjectData['@context']
  const objectToSend: activityPubObject = {
    '@context': [`${completeEnvironment.frontendUrl}/contexts/litepub-0.1.jsonld`],
    actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    id: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}#update/${new Date().getTime()}`,
    object: userObjectData,
    type: 'Update'
  }

  let serversToSendThePost = await FederatedHost.findAll({
    where: {
      publicInbox: { [Op.ne]: null },
      blocked: { [Op.ne]: true },

      [Op.or]: [
        sequelize.literal(
          `"id" in (SELECT "federatedHostId" from "users" where "users"."id" IN (SELECT "followerId" from "follows" where "followedId" = '${user.id}') and "federatedHostId" is not NULL)`
        ),
        {
          friendServer: true
        }
      ]
    }
  })
  const inboxes: string[] = serversToSendThePost.map((elem) => elem.publicInbox as string).filter((elem) => !!elem)

  for await (const inboxChunk of inboxes) {
    await lowPriorityQueue.add(
      'sendChunk',
      {
        objectToSend: objectToSend,
        petitionBy: user.dataValues,
        inboxList: inboxChunk
      },
      {
        priority: 2097152,
        delay: 500
      }
    )
  }
}

export { sendUpdateProfile }

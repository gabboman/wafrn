import { Job, Queue, QueueEvents } from 'bullmq'
import { User } from '../../db'
import { environment } from '../../environment'

import { logger } from '../logger'
import { getUserIdFromRemoteId } from '../cacheGetters/getUserIdFromRemoteId'

const deletedUser = environment.forceSync
  ? undefined
  : User.findOne({
      where: {
        url: environment.deletedUser
      }
    })
const queue = new Queue('getRemoteActorId', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
  }
})
const queueEvents = new QueueEvents('getRemoteActorId', {
  connection: environment.bullmqConnection
})
async function getRemoteActor(actorUrl: string, user: any, forceUpdate = false): Promise<any> {
  let remoteUser;
  try {
    // we check its a string. A little bit dirty but could be worse
    actorUrl.startsWith(environment.frontendUrl + '/fediverse/blog/')
    let userId = await getUserIdFromRemoteId(actorUrl);
    if(userId === '') {
      const job = await queue.add(
        'getRemoteActorId',
        { actorUrl: actorUrl, userId: user.id, forceUpdate: forceUpdate }
      )
      userId = await job.waitUntilFinished(queueEvents)
    }
    remoteUser = await User.findByPk(userId)
    if (!remoteUser || (remoteUser && remoteUser.banned)) {
      remoteUser = await deletedUser
    }
  } catch (error) {
    logger.trace(`Error fetching user ${actorUrl}`)
  }
  // update user if last update was more than 24 hours ago
  if(remoteUser.url !== environment.deletedUser) {
    const lastUpdate = new Date(remoteUser.updatedAt)
    const now = new Date()
    if(now.getTime() - lastUpdate.getTime() > 24 * 3600 * 1000 || forceUpdate) {
      await queue.add(
        'getRemoteActorId',
        { actorUrl: actorUrl, userId: user.id, forceUpdate: true },
        {
          jobId: actorUrl
        }
      )
    }
  }
  return remoteUser
}

export { getRemoteActor }

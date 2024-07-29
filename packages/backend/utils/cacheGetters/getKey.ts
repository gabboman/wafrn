import { Queue } from 'bullmq'
import { User } from '../../db'
import { getRemoteActor } from '../activitypub/getRemoteActor'
import { redisCache } from '../redis'
import { getUserIdFromRemoteId } from './getUserIdFromRemoteId'
import { environment } from '../../environment'
import { logger } from '../logger'

const queue = new Queue('getRemoteActorId', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
})

async function getKey(remoteUserUrl: string, adminUser: any): Promise<{ key?: any }> {
  const cachedKey = await redisCache.get('key:' + remoteUserUrl)
  let remoteKey = cachedKey //if petition from neew user we need to get the key first
  if (!remoteKey) {
    const userId = await getUserIdFromRemoteId(remoteUserUrl)
    if (userId && userId !== '') {
      return {
        key: (await User.findByPk(userId)).publicKey
      }
    } else {
      await queue.add(
        'getRemoteActorId',
        { actorUrl: remoteUserUrl, userId: adminUser.id, forceUpdate: true },
        {
          jobId: remoteUserUrl.replaceAll(':', '_').replaceAll('/', '_')
        }
      )
      return {}
    }
  }
  if (!cachedKey && remoteKey) {
    // we set the key valid for 5 minutes
    redisCache.set('key:' + remoteUserUrl, remoteKey, 'EX', 300)
  }
  return { key: remoteKey }
}

export { getKey }

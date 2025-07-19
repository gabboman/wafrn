import { Queue } from 'bullmq'
import { User } from '../../models/index.js'
import { redisCache } from '../redis.js'
import { getUserIdFromRemoteId } from './getUserIdFromRemoteId.js'
import { completeEnvironment } from '../backendOptions.js'

const queue = new Queue('getRemoteActorId', {
  connection: completeEnvironment.bullmqConnection,
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

async function getKey(remoteUserUrl: string, adminUser: any): Promise<{ user?: User; key?: string }> {
  const cachedKey = await redisCache.get('key:' + remoteUserUrl)
  let user
  let remoteKey = cachedKey || undefined //if petition from neew user we need to get the key first
  if (!remoteKey) {
    const userId = await getUserIdFromRemoteId(remoteUserUrl)
    if (userId && userId !== '') {
      user = (await User.findByPk(userId)) || undefined
      remoteKey = user?.publicKey
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
  return { user: user, key: remoteKey }
}

export { getKey }

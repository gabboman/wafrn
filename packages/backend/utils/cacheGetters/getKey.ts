import { getRemoteActor } from '../activitypub/getRemoteActor'
import { redisCache } from '../redis'

async function getKey(remoteUserUrl: string, adminUser: any) {
  const cachedKey = await redisCache.get('key:' + remoteUserUrl)
  const remoteKey = cachedKey ? cachedKey : (await getRemoteActor(remoteUserUrl, adminUser)).publicKey
  if (!cachedKey && remoteKey) {
    // we set the key valid for 5 minutes
    redisCache.set('key:' + remoteUserUrl, remoteKey, 'EX', 300)
  }
  return remoteKey
}

export { getKey }

import { FederatedHost } from '../../db'
import { redisCache } from '../redis'

async function getallBlockedServers(): Promise<string[]> {
  let res: string[] = []
  const cacheResult = await redisCache.get('allBlockedServers')
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const blockedServers = await FederatedHost.findAll({
      attributes: ['id'],
      where: {
        blocked: true
      }
    })
    if (blockedServers) {
      res = blockedServers.map((elem: any) => elem.id)
      await redisCache.set('allBlockedServers', JSON.stringify(res), 'EX', 300)
    }
  }
  return res
}

export { getallBlockedServers }

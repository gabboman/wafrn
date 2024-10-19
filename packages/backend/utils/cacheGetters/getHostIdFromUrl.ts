import { FederatedHost, sequelize } from '../../db.js'
import { redisCache } from '../redis.js'

async function getFederatedHostIdFromUrl(hostname: string): Promise<string> {
  let res = '00000000-0000-0000-0000-000000000000'
  const cacheResult = await redisCache.get('FederatedHostId:' + hostname.toLocaleLowerCase())
  if (cacheResult) {
    res = cacheResult
  } else {
    const host = await FederatedHost.findOne({
      attributes: ['id'],
      where: {
        displayName: sequelize.where(sequelize.fn('LOWER', sequelize.col('displayName')), '=', hostname.toLowerCase())
      }
    })
    if (host) {
      res = host.id
      await redisCache.set('FederatedHostId:' + hostname.toLocaleLowerCase(), res)
    }
  }
  return res
}

export { getFederatedHostIdFromUrl }

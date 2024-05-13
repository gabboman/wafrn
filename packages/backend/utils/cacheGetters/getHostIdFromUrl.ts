import { FederatedHost, sequelize } from '../../db'
import { redisCache } from '../redis'

async function getFederatedHostIdFromUrl(hostname: string): Promise<string> {
  let res = ''
  const cacheResult = await redisCache.get('FederatedHostId:' + hostname.toLocaleLowerCase())
  if (cacheResult) {
    res = cacheResult
  } else {
    const host = await FederatedHost.findOne({
      attributes: ['id'],
      where: {
        displayName: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('displayName')),
          'LIKE',
          hostname.toLowerCase()
        )
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

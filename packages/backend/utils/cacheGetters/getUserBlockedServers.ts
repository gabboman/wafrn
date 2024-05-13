import { Op } from 'sequelize'
import { redisCache } from '../redis'
import { ServerBlock } from '../../db'

export default async function getUserBlockedServers(userId: string): Promise<string[]> {
  const cacheResult = await redisCache.get('serverblocks:' + userId)
  if (cacheResult) {
    return JSON.parse(cacheResult)
  }
  try {
    const blocksServers = await ServerBlock.findAll({
      where: {
        userBlockerId: userId
      }
    })
    const result = blocksServers.map((elem: any) => elem.dataValues)
    redisCache.set('serverblocks:' + userId, JSON.stringify(result))
    return result as string[]
  } catch (error) {
    return []
  }
}

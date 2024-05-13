import { Op } from 'sequelize'
import { Blocks, Mutes, User } from '../../db'
import { redisCache } from '../redis'

export default async function getBlockedIds(userId: string, includeMutes = true): Promise<string[]> {
  try {
    const cacheResult = await redisCache.get('blocks:full:' + userId)
    if (cacheResult) {
      return JSON.parse(cacheResult)
    }
    const blocks = Blocks.findAll({
      where: {
        [Op.or]: [
          {
            blockerId: userId
          },
          {
            blockedId: userId
          }
        ]
      }
    })
    const mutes = includeMutes
      ? Mutes.findAll({
          where: {
            muterId: userId
          }
        })
      : []
    await Promise.all([blocks, mutes])
    const res = (await blocks)
      .map((block: any) => (block.blockerId !== userId ? block.blockerId : block.blockedId))
      .concat((await mutes).map((mute: any) => mute.mutedId))
    redisCache.set('blocks:' + userId, JSON.stringify(res))
    return res
  } catch (error) {
    return []
  }
}

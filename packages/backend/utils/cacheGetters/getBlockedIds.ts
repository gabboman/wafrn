import { Op } from 'sequelize'
import { Blocks, Mutes, User } from '../../models/index.js'
import { redisCache } from '../redis.js'
import { logger } from '../logger.js'

export default async function getBlockedIds(
  userId: string,
  includeMutes = true,
  onlyUserBlocks = false
): Promise<string[]> {
  const cacheKey = 'blocks:' + includeMutes ? 'mutes:' : '' + onlyUserBlocks ? 'onlyUser:' : ''
  try {
    const cacheResult = await redisCache.get(cacheKey + userId)
    if (cacheResult) {
      return JSON.parse(cacheResult)
    }
    const blocks = Blocks.findAll({
      where: {
        [Op.or]: [
          {
            blockerId: userId
          },
          // if only user blocks we ask twice for the users that only the user has blocked
          onlyUserBlocks
            ? {
              blockerId: userId
            }
            : {
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
    redisCache.set(cacheKey + userId, JSON.stringify(res), 'EX', 600)
    // to avoid sequelize stuff. should add to other cachers too tbh
    return res.length > 0 ? res : ['00000000-0000-0000-0000-000000000000']
  } catch (error) {
    logger.error(error)
    return []
  }
}

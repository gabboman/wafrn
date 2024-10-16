import { UserOptions } from '../../db.js'
import { redisCache } from '../redis.js'

async function getUserOptions(userId: string): Promise<Array<{ optionName: string; optionValue: string }>> {
  const cacheReply = await redisCache.get('userOptions:' + userId)
  if (cacheReply) {
    return JSON.parse(cacheReply)
  } else {
    const dbReply = await UserOptions.findAll({
      where: {
        userId: userId
      }
    })
    redisCache.set('userOptions:' + userId, JSON.stringify(dbReply.map((elem: any) => elem.dataValues)), 'EX', 300)
    return getUserOptions(userId)
  }
}

export { getUserOptions }

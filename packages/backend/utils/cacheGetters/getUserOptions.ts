import { UserOptions } from '../../db'
import { redisCache } from '../redis'

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
    redisCache.set('userOptions:' + userId, JSON.stringify(dbReply.map((elem: any) => elem.dataValues)))
    return getUserOptions(userId)
  }
}

export { getUserOptions }

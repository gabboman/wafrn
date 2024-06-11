import { Mutes } from '../../db'
import { redisCache } from '../redis'

async function getMutedUsers(userId: string): Promise<Array<string>> {
  let res: string[] = []
  const cacheResult = await redisCache.get('mutedUsers:' + userId)
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const mutedUsersQuery = await Mutes.findAll({
      where: {
        muterId: userId
      }
    })
    res = mutedUsersQuery.map((elem: any) => elem.mutedId)
    await redisCache.set('mutedUsers:' + userId, JSON.stringify(res))
  }
  return res
}

export { getMutedUsers }

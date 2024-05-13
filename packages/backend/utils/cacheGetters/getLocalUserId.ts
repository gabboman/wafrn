import { User, sequelize } from '../../db'
import { redisCache } from '../redis'

async function getLocalUserId(url: string): Promise<string> {
  let res = ''
  const cacheResult = await redisCache.get('localUserId:' + url)
  if (cacheResult) {
    res = cacheResult
  } else {
    const localUser = await User.findOne({
      attributes: ['id'],
      where: {
        url: sequelize.where(sequelize.fn('LOWER', sequelize.col('url')), 'LIKE', url.toLowerCase())
      }
    })
    if (localUser) {
      res = localUser.id
      await redisCache.set('localUserId:' + url, res)
    }
  }
  return res
}

export { getLocalUserId }

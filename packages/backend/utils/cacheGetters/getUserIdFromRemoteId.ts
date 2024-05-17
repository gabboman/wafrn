import { User, sequelize } from '../../db'
import { environment } from '../../environment'
import { redisCache } from '../redis'

async function getUserIdFromRemoteId(remoteId: string): Promise<string> {
  let res = ''
  const cacheResult = await redisCache.get('userRemoteId:' + remoteId.toLocaleLowerCase())
  if (cacheResult) {
    res = cacheResult
  } else {
    const user = remoteId.startsWith(environment.frontendUrl)
      ? await User.findOne({
          attributes: ['id'],
          where: {
            url: remoteId.split(`${environment.instanceUrl}/fediverse/blog/`)[1].split('@')[0]
          }
        })
      : await User.findOne({
          attributes: ['id'],
          where: {
            remoteId: sequelize.where(sequelize.fn('LOWER', sequelize.col('remoteId')), 'LIKE', remoteId.toLowerCase())
          }
        })
    if (user) {
      res = user.id
      await redisCache.set('userRemoteId:' + remoteId.toLocaleLowerCase(), res)
    }
  }
  return res
}

export { getUserIdFromRemoteId }

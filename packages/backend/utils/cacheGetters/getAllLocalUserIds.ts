import { Op } from 'sequelize'
import { User, sequelize } from '../../db.js'
import { redisCache } from '../redis.js'

async function getAllLocalUserIds(): Promise<string[]> {
  let res: string[] = []
  const cacheResult = await redisCache.get('allLocalUserIds')
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const localUsers = await User.findAll({
      attributes: ['id'],
      where: {
        email: {
          [Op.ne]: null
        },
        banned: false,
        activated: true
      }
    })
    if (localUsers) {
      res = localUsers.map((elem: any) => elem.id)
      await redisCache.set('allLocalUserIds', JSON.stringify(res), 'EX', 600)
    }
  }
  return res
}

export { getAllLocalUserIds }

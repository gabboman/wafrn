import { Op } from 'sequelize'
import { User, sequelize } from '../../db'
import { redisCache } from '../redis'

async function getAllLocalUserIds(): Promise<string[]> {
  let res: string[] = []
  const cacheResult = await redisCache.get('allLocalUserIds')
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const localUsers = await User.findAll({
      attributes: ['id'],
      where: {
        url: {
          [Op.notLike]: '@%'
        },
        banned: false
      }
    })
    if (localUsers) {
      res = localUsers.map((elem: any) => elem.id)
      await redisCache.set('allLocalUserIds', JSON.stringify(res))
    }
  }
  return res
}

export { getAllLocalUserIds }

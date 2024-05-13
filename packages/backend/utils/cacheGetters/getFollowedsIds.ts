import { Op } from 'sequelize'
import { Blocks, Follows, User } from '../../db'
import getBlockedIds from './getBlockedIds'
import { redisCache } from '../redis'

export default async function getFollowedsIds(userId: string, local = false): Promise<string[]> {
  const cacheResult = await redisCache.get(local ? 'follows:local:' + userId : 'follows:full:' + userId)
  if (cacheResult) {
    return JSON.parse(cacheResult)
  }
  try {
    const usersWithBlocks = await getBlockedIds(userId)
    const whereObject: any = {
      followerId: userId,
      accepted: true,
      followedId: {
        [Op.notIn]: usersWithBlocks
      }
    }
    if (local) {
      whereObject['$follower.url$'] = {
        [Op.notLike]: '@%'
      }
    }
    const followed = await Follows.findAll({
      attributes: ['followedId'],
      include: [
        {
          model: User,
          as: 'follower',
          attributes: ['url'],
          where: {
            banned: {
              [Op.ne]: true
            }
          }
        }
      ],
      where: whereObject
    })
    const result = followed.map((followed: any) => followed.followedId)
    result.push(userId)
    redisCache.set(local ? 'follows:local:' + userId : 'follows:full:' + userId, JSON.stringify(result))
    return result as string[]
  } catch (error) {
    return []
  }
}

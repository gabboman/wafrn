import { Op } from 'sequelize'
import { Blocks, Follows, User } from '../../models/index.js'
import getBlockedIds from './getBlockedIds.js'
import { redisCache } from '../redis.js'

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
    let result = followed.map((followed: any) => followed.followedId)
    result.push(userId)
    // TODO this is sub optimal. I mean we do two queries instead of one EVERY 10 MINUTES OH MY GOD
    // obviously is not the end of the world. but its still suboptimal
    if (local) {
      const localUsers = await User.findAll({
        where: {
          id: {
            [Op.in]: result
          },
          email: {
            [Op.ne]: undefined
          }
        }
      })
      result = localUsers.map((usr) => usr.id)
    }
    redisCache.set(local ? 'follows:local:' + userId : 'follows:full:' + userId, JSON.stringify(result), 'EX', 600)
    return result as string[]
  } catch (error) {
    return []
  }
}

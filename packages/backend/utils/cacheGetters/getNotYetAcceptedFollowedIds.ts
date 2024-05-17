import { Op } from 'sequelize'
import { Follows, User } from '../../db'
import { redisCache } from '../redis'

async function getNotYetAcceptedFollowedids(userId: string): Promise<Array<string>> {
  let res: string[] = []
  const cacheResult = await redisCache.get('follows:notYetAcceptedFollows:' + userId)
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const notAcceptedFollows = await Follows.findAll({
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
      where: {
        followerId: userId,
        accepted: false
      }
    })
    res = notAcceptedFollows.map((elem: any) => elem.followedId)
    await redisCache.set('follows:notYetAcceptedFollows:' + userId, JSON.stringify(res))
  }
  return res
}

export { getNotYetAcceptedFollowedids }

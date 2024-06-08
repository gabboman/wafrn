import { Op } from 'sequelize'
import { Follows, User } from '../../db'
import { redisCache } from '../redis'
import getFollowedsIds from './getFollowedsIds'
import { environment } from '../../environment'

async function getFollowedRemoteIds(id: string) {
  const cacheResult = await redisCache.get('remoteFollowed:' + id)
  if (cacheResult) {
    return JSON.parse(cacheResult)
  } else {
    const follows = await Follows.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'followed'
        }
      ],
      where: {
        followerId: id
      }
    })
    const res = follows.map((follow: any) =>
      follow.followed.url.startsWith('@')
        ? follow.followed.remoteId
        : `${environment.frontendUrl}/fediverse/blog/${follow.followed.url}`
    )
    await redisCache.set('remoteFollowed:' + id, JSON.stringify(res), 'EX', 300)
    return res
  }
}

export { getFollowedRemoteIds }

import { Op } from 'sequelize'
import { Follows, User } from '../../db'
import { redisCache } from '../redis'
import { environment } from '../../environment'

async function getFollowerRemoteIds(id: string) {
  const cacheResult = await redisCache.get('remoteFollower:' + id)
  if (cacheResult) {
    return JSON.parse(cacheResult)
  } else {
    const follows = await Follows.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'follower'
        }
      ],
      where: {
        followedId: id
      }
    })
    const res = follows.map((follow: any) =>
      follow.follower.url.startsWith('@')
        ? follow.followed.remoteId
        : `${environment.frontendUrl}/fediverse/blog/${follow.followed.url}`
    )
    await redisCache.set('remoteFollower:' + id, JSON.stringify(res), 'EX', 300)
    return res
  }
}

export { getFollowerRemoteIds }

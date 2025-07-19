import { Op } from 'sequelize'
import { Follows, User } from '../../models/index.js'
import { redisCache } from '../redis.js'
import { completeEnvironment } from '../backendOptions.js'

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
          as: 'followed'
        }
      ],
      where: {
        followedId: id,
        accepted: true
      }
    })
    const res = follows.map((follow: any) =>
      follow.followed.url.startsWith('@')
        ? follow.followed.remoteId
        : `${completeEnvironment.frontendUrl}/fediverse/blog/${follow.followed.url}`
    )
    await redisCache.set('remoteFollower:' + id, JSON.stringify(res), 'EX', 300)
    return res
  }
}

export { getFollowerRemoteIds }

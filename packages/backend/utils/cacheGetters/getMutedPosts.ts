import { Op } from 'sequelize'
import { sequelize, SilencedPost } from '../../db.js'
import { redisCache } from '../redis.js'

async function getMutedPosts(userId: string, superMute = false): Promise<Array<string>> {
  let res: string[] = []
  const cacheResult = await redisCache.get((superMute ? 'superMutedPosts' : 'mutedPosts:') + userId)
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const mutedPostsQuery = await SilencedPost.findAll({
      where: {
        userId: userId,
        superMuted: superMute
          ? true
          : {
              [Op.in]: [true, false, null, undefined] // yeah ok this is a bit dirty haha but its only one code path
            }
      },
      attributes: ['postId']
    })
    res = mutedPostsQuery.map((elem: any) => elem.postId)
    if (superMute) {
      const mutedPosts = await sequelize.query(
        `SELECT "postsId" FROM "postsancestors" where "ancestorId" IN (${res.map((elem) => "'" + elem + "'")})`
      )
      res = mutedPosts[0].map((elem) => elem.postsId)
    }
    await redisCache.set((superMute ? 'superMutedPosts:' : 'mutedPosts:') + userId, JSON.stringify(res), 'EX', 600)
  }
  return res
}

export { getMutedPosts }

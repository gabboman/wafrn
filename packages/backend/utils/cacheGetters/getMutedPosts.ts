import { Op } from 'sequelize'
import { SilencedPost } from '../../db'
import { redisCache } from '../redis'

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
    await redisCache.set((superMute ? 'superMutedPosts' : 'mutedPosts:') + userId, JSON.stringify(res))
  }
  return res
}

export { getMutedPosts }

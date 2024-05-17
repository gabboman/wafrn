import { SilencedPost } from '../../db'
import { redisCache } from '../redis'

async function getMutedPosts(userId: string): Promise<Array<string>> {
  let res: string[] = []
  const cacheResult = await redisCache.get('mutedPosts:' + userId)
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const mutedPostsQuery = await SilencedPost.findAll({
      where: {
        userId: userId
      },
      attributes: ['postId']
    })
    res = mutedPostsQuery.map((elem: any) => elem.postId)
    await redisCache.set('mutedPosts:' + userId, JSON.stringify(res))
  }
  return res
}

export { getMutedPosts }

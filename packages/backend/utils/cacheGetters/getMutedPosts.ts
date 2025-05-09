import { Op } from 'sequelize'
import { PostAncestor, sequelize, SilencedPost } from '../../models/index.js'
import { redisCache } from '../redis.js'

async function getMutedPosts(userId: string, superMute = false): Promise<Array<string>> {
  let res: string[] = []
  const cacheResult = await redisCache.get((superMute ? 'superMutedPosts:' : 'mutedPosts:') + userId)
  if (cacheResult) {
    res = JSON.parse(cacheResult)
  } else {
    const mutedPostsQuery = await SilencedPost.findAll({
      where: {
        userId: userId,
        superMuted: superMute
          ? true
          : {
            [Op.in]: [true, false, null, undefined] as any // yeah ok this is a bit dirty haha but its only one code path
          }
      },
      attributes: ['postId']
    })
    res = mutedPostsQuery.map((elem: any) => elem.postId)
    if (superMute && res.length) {
      const muted = res.map((elem) => "'" + (elem ? elem : '00000000-0000-0000-0000-000000000000') + "'")
      const mutedPosts = await sequelize.query(
        `SELECT "postsId" FROM "postsancestors" where "ancestorId" IN (${muted})`
      ) as PostAncestor[][]
      res = mutedPosts[0].map((elem) => elem.postsId)
    }
    await redisCache.set((superMute ? 'superMutedPosts:' : 'mutedPosts:') + userId, JSON.stringify(res), 'EX', 600)
  }
  return res
}

async function getMutedPostsMultiple(userIds: string[], superMute = false) {
  const cacheResults = await redisCache.mget(
    userIds.map((userId) => (superMute ? 'superMutedPosts:' : 'mutedPosts:') + userId)
  )

  if (cacheResults.every((result) => !!result)) {
    const ids = cacheResults.map((result) => JSON.parse(result!) as string[])
    return new Map(userIds.map((userId, index) => [userId, ids[index]]))
  }

  const where = {
    userId: {
      [Op.in]: userIds
    }
  } as { userId: Record<any, any>; superMuted?: true }

  if (superMute) {
    where.superMuted = true
  }

  const mutedFirstIds = await SilencedPost.findAll({
    where,
    attributes: ['postId', 'userId']
  })

  const postIds = new Map<string, string[]>()
  for (const result of cacheResults) {
    const index = cacheResults.indexOf(result)
    const userId = userIds[index]

    if (result) {
      postIds.set(userId, JSON.parse(result) as string[])
    } else {
      let mutedIds = mutedFirstIds.filter((elem) => elem.userId === userId).map((elem) => elem.postId)
      
      if (superMute && mutedIds.length) {
        const formattedIds = mutedIds.map((elem) => "'" + elem + "'").join(',')
        const mutedPosts = await sequelize.query(
          `SELECT "postsId" FROM "postsancestors" where "ancestorId" IN (${formattedIds})`,
        ) as [PostAncestor[], unknown]
        mutedIds = mutedPosts[0].map((elem) => elem.postsId)
      }

      await redisCache.set(
        (superMute ? 'superMutedPosts:' : 'mutedPosts:') + userIds[index],
        JSON.stringify(mutedIds),
        'EX',
        600
      )
      postIds.set(userId, mutedIds)
    }
  }

  return postIds
}

export { getMutedPosts, getMutedPostsMultiple }

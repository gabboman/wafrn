import { redisCache } from "../../utils/redis.js";
import { Follows, User } from "../../db.js";
import { Op } from "sequelize";
import { getAllLocalUserIds } from "../../utils/cacheGetters/getAllLocalUserIds.js";
import { cache } from "sharp";


async function getCacheAtDids(): Promise<{ followedDids: string[], localUserDids: string[], followedUsersLocalIds: string[] }> {
  let cacheResult = await redisCache.get('follows:bsky')
  if (!cacheResult) {
    const follows = await Follows.findAll({
      attributes: ['followedId'],
      group: ['followedId'],
      where: {
        followedId: {
          [Op.notIn]: await getAllLocalUserIds()
        },
        bskyUri: {
          [Op.ne]: null
        }
      }
    })
    const dids = await User.findAll({
      attributes: ['bskyDid', 'id'],
      where: {
        id: {
          [Op.in]: follows.map(elem => elem.followedId)
        },
        url: {
          [Op.startsWith]: '@'
        }
      }
    })
    const localUsersWithDid = await User.findAll({
      attributes: ['bskyDid'],
      where: {
        id: {
          [Op.in]: await getAllLocalUserIds()
        },
        bskyDid: {
          [Op.ne]: null
        }
      }
    })
    const followedUsersLocalIds = dids.map(elem => elem.id);
    const followedDids = dids.map(elem => elem.bskyDid);
    const localUserDids = localUsersWithDid.map(elem => elem.bskyDid)
    cacheResult = JSON.stringify({ followedDids: followedDids, localUserDids: localUserDids, followedUsersLocalIds: followedUsersLocalIds })
    await redisCache.set('follows:bsky', cacheResult)
  }
  return JSON.parse(cacheResult);
}

export { getCacheAtDids }

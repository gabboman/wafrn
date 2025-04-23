import { Follows, User } from '../../models/index.js'
import { Op } from 'sequelize'
import { getAllLocalUserIds } from '../../utils/cacheGetters/getAllLocalUserIds.js'
import { cache } from 'sharp'
import { environment } from '../../environment.js'
import { Queue } from 'bullmq'

let superCache:
  | undefined
  | { followedDids: Set<string>; localUserDids: Set<string>; followedUsersLocalIds: Set<string> }

// TODO improve this. This function is called A LOT and we could use a lot less of JSON PARSE
async function getCacheAtDids(
  forceUpdate = false
): Promise<{ followedDids: Set<string>; localUserDids: Set<string>; followedUsersLocalIds: Set<string> }> {
  if (!forceUpdate && superCache) {
    return superCache
  }
  let cacheResult = forceUpdate ? undefined : superCache
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
          [Op.in]: follows.map((elem) => elem.followedId)
        },
        email: {
          [Op.eq]: null
        },
        bskyDid: {
          [Op.ne]: null
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
    const followedUsersLocalIds = new Set<string>(dids.map((elem) => elem.id).filter((elem) => elem != ''))
    const localUserDids = new Set<string>(localUsersWithDid.map((elem) => elem.bskyDid).filter((elem) => elem != ''))
    const followedDids = new Set<string>(
      dids
        .map((elem) => elem.bskyDid)
        .concat(localUserDids)
        .filter((elem) => elem != '')
    )

    cacheResult = {
      followedDids: followedDids,
      localUserDids: localUserDids,
      followedUsersLocalIds: followedUsersLocalIds
    }
  }
  superCache = cacheResult
  return cacheResult
}

async function forceUpdateCacheDidsAtThread() {
  const forceUpdaDidsteQueue = new Queue('forceUpdateDids', {
    connection: environment.bullmqConnection,
    defaultJobOptions: {
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000
      }
    }
  })
  await forceUpdaDidsteQueue.add('forceUpdateDids', {})
}

export { getCacheAtDids, forceUpdateCacheDidsAtThread }

import { Op } from 'sequelize'
import { Blocks, Follows, User } from '../db'
import { logger } from './logger'
import { Response } from 'express'
import { remoteFollow } from './activitypub/remoteFollow'
import { redisCache } from './redis'

async function follow(followerId: string, followedId: string, petition?: Response): Promise<boolean> {
  let res = false
  try {
    const userFollowed = await User.findOne({
      where: {
        id: followedId
      }
    })
    const blocksExisting = await Blocks.count({
      where: {
        [Op.or]: [
          {
            blockerId: followerId,
            blockedId: { [Op.in]: [followedId] }
          },
          {
            blockedId: followerId,
            blockerId: { [Op.in]: [followedId] }
          }
        ]
      }
    })
    if (blocksExisting > 0) {
      if (petition) {
        petition.sendStatus(500)
        petition.send({
          error: true,
          message: 'You can not follow someone who you have blocked, nor who has blocked you'
        })
      }
      res = false
      return res
    }
    const follow = await Follows.create({
      followerId: followerId,
      followedId: userFollowed.id,
      accepted: userFollowed.url.startsWith('@') ? false : !userFollowed.manuallyAcceptsFollows
    })
    res = true
    if (userFollowed.remoteId) {
      res = true
      const localUser = await User.findOne({ where: { id: followerId } })
      remoteFollow(localUser, userFollowed)
        .then((response) => {
          redisCache.del('follows:full:' + followerId)
          redisCache.del('follows:local:' + followerId)
          redisCache.del('follows:notYetAcceptedFollows:' + followerId)
        })
        .catch(async (error) => {
          logger.info('error following remote user')
          await follow.destroy()
          // TODO INFORM USER ABOUT THE ISSUE
        })
    }
    redisCache.del('follows:full:' + followerId)
    redisCache.del('follows:local:' + followerId)
    redisCache.del('follows:notYetAcceptedFollows:' + followerId)
  } catch (error) {
    logger.error(error)
    res = false
  }
  return res
}

export { follow }

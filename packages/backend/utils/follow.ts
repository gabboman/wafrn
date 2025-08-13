import { Op } from 'sequelize'
import { Blocks, Follows, Notification, User } from '../models/index.js'
import { logger } from './logger.js'
import { Response } from 'express'
import { remoteFollow } from './activitypub/remoteFollow.js'
import { redisCache } from './redis.js'
import { createNotification } from './pushNotifications.js'

async function follow(
  followerId: string,
  followedId: string,
  petition?: Response,
  bskyResult?: { uri: string; cid: string }
): Promise<boolean> {
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
        petition.status(500)
        petition.send({
          error: true,
          message: 'You can not follow someone who you have blocked, nor who has blocked you'
        })
      }
      res = false
      return res
    }
    const existingFollow =
      userFollowed &&
      (await Follows.findOne({
        where: {
          followerId: followerId,
          followedId: userFollowed.id
        }
      }))
    if (userFollowed && !existingFollow) {
      const follow = await Follows.create({
        followerId: followerId,
        followedId: userFollowed.id,
        accepted:
          (!!userFollowed.bskyDid && userFollowed.url.startsWith('@')) ||
          (userFollowed.url.startsWith('@') ? false : !userFollowed.manuallyAcceptsFollows),
        bskyUri: bskyResult?.uri,
        muteQuotes: false,
        muteRewoots: false
      })
      if (follow.accepted) {
        // if user does this manualy you dont want to give them a notification after accepting lol
        await createNotification(
          {
            notificationType: 'FOLLOW',
            userId: followerId,
            notifiedUserId: userFollowed?.id
          },
          {
            userUrl: (await User.findByPk(followerId))?.url
          }
        )
      }
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
    }
    res = true
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

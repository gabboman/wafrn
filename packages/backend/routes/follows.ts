import { Application, Response } from 'express'
import { Blocks, Follows, Notification, User } from '../db.js'
import { authenticateToken } from '../utils/authenticateToken.js'

import getBlockedIds from '../utils/cacheGetters/getBlockedIds.js'
import { logger } from '../utils/logger.js'
import { remoteFollow } from '../utils/activitypub/remoteFollow.js'
import { remoteUnfollow } from '../utils/activitypub/remoteUnfollow.js'
import { Model, Op, Sequelize } from 'sequelize'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { follow } from '../utils/follow.js'
import { redisCache } from '../utils/redis.js'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds.js'
import { getNotYetAcceptedFollowedids } from '../utils/cacheGetters/getNotYetAcceptedFollowedIds.js'
import { getUserOptions } from '../utils/cacheGetters/getUserOptions.js'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts.js'
import { environment } from '../environment.js'
import { getAtProtoSession } from '../atproto/utils/getAtProtoSession.js'
import { forceUpdateCacheDidsAtThread, getCacheAtDids } from '../atproto/cache/getCacheAtDids.js'

export default function followsRoutes(app: Application) {
  // TODO refactor? It works, but I have a few res.send and thats not nice!
  app.post('/api/follow', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const posterId = req.jwtData?.userId ? req.jwtData.userId : environment.deletedUser
      const options = await getUserOptions(posterId)
      const userFederatesWithThreads = options.filter(
        (elem) => elem.optionName === 'wafrn.federateWithThreads' && elem.optionValue === 'true'
      )
      const userToBeFollowed = (await User.findByPk(req.body.userId)) as Model<any, any>

      if (userFederatesWithThreads.length === 0) {
        if (userToBeFollowed.url.toLowerCase().endsWith('threads.net')) {
          res.status(500)
          res.send({
            error: true,
            message: 'You are trying to follow a threads user but you did not enable threads federation'
          })
        }
      }
      // bsky user
      if (userToBeFollowed.url.split('@').length === 2 && userToBeFollowed.bskyDid) {
        const localUser = (await User.findByPk(posterId)) as Model<any, any>
        if (localUser.enableBsky) {
          // follow on bsk
          const agent = await getAtProtoSession(localUser)
          const followResult = await agent.follow(userToBeFollowed.bskyDid)
          if (followResult.validationStatus == 'valid') {
            await follow(posterId, req.body.userId, res, followResult)
            await forceUpdateCacheDidsAtThread()
            await getCacheAtDids(true)
            return res.send({ success: true })
          } else {
            return res.sendStatus(500)
          }
        } else {
          return res.status(500).send({
            error: true,
            message: 'You are trying to follow a bsky user. You need to enable this on your profile'
          })
        }
      }

      if (req.body?.userId && posterId) {
        success = await follow(posterId, req.body.userId, res)
      }
    } catch (error) {
      logger.error(error)
    }

    res.send({
      success
    })
  })

  app.post('/api/unfollow', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    // TODO remote user unfollow
    let success = false
    try {
      const posterId = req.jwtData?.userId
      if (req.body?.userId) {
        const userUnfollowed = (await User.findByPk(req.body.userId)) as Model<any, any>
        await Notification.destroy({
          where: {
            notificationType: 'FOLLOW',
            userId: posterId,
            notifiedUserId: userUnfollowed.id
          }
        })
        if (userUnfollowed.remoteId) {
          const localUser = await User.findOne({ where: { id: posterId } })
          remoteUnfollow(localUser, userUnfollowed)
            //.then(() => {})
            .catch((error) => {
              logger.info('error unfollowing remote user')
            })
        }

        const follow = (await Follows.findOne({
          where: {
            followerId: posterId,
            followedId: userUnfollowed.id
          }
        })) as Model<any, any>
        if (follow?.bskyUri) {
          const agent = await getAtProtoSession(await User.findByPk(posterId))
          await agent.deleteFollow(follow.bskyUri)
          await forceUpdateCacheDidsAtThread()
          await getCacheAtDids(true)
        }
        userUnfollowed.removeFollower(posterId)
        redisCache.del('follows:full:' + posterId)
        redisCache.del('follows:local:' + posterId)
        redisCache.del('follows:notYetAcceptedFollows:' + posterId)
        success = true
      }
    } catch (error) {
      logger.error(error)
    }

    res.send({
      success
    })
  })
}

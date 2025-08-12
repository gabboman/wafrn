import { Application, Response } from 'express'
import { Blocks, Follows, Notification, User } from '../models/index.js'
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
import { getAtProtoSession } from '../atproto/utils/getAtProtoSession.js'
import { forceUpdateCacheDidsAtThread, getCacheAtDids } from '../atproto/cache/getCacheAtDids.js'
import { completeEnvironment } from '../utils/backendOptions.js'

export default function followsRoutes(app: Application) {
  // TODO refactor? It works, but I have a few res.send and thats not nice!
  app.post('/api/follow', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const posterId = req.jwtData?.userId ? req.jwtData.userId : completeEnvironment.deletedUser
      const options = await getUserOptions(posterId)
      const userFederatesWithThreads = options.filter(
        (elem) => elem.optionName === 'wafrn.federateWithThreads' && elem.optionValue === 'true'
      )
      const userToBeFollowed = await User.findByPk(req.body.userId)

      if (userFederatesWithThreads.length === 0) {
        if (userToBeFollowed?.url.toLowerCase().endsWith('.threads.net')) {
          res.status(403)
          res.send({
            error: true,
            message: 'You are trying to follow a threads user but you did not enable threads federation'
          })
        }
      }
      // bsky user
      if (userToBeFollowed?.url.split('@').length === 2 && userToBeFollowed.bskyDid) {
        const localUser = await User.findByPk(posterId)
        if (localUser?.enableBsky) {
          // follow on bsk
          const agent = await getAtProtoSession(localUser)
          const followResult = (await agent.follow(userToBeFollowed.bskyDid)) as any
          if (followResult.validationStatus == 'valid') {
            await follow(posterId, req.body.userId, res, followResult)
            await forceUpdateCacheDidsAtThread()
            await getCacheAtDids(true)
            return res.send({ success: true })
          } else {
            return res.sendStatus(500)
          }
        } else {
          return res.status(403).send({
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
    try {
      res.send({
        success
      })
    } catch (error) {
      logger.info({ message: `Error on follow`, error })
    }
  })

  app.post('/api/unfollow', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    // TODO remote user unfollow
    let success = false
    try {
      const posterId = req.jwtData?.userId
      if (req.body?.userId) {
        const userUnfollowed = await User.findByPk(req.body.userId)
        if (userUnfollowed) {
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

          const follow = await Follows.findOne({
            where: {
              followerId: posterId,
              followedId: userUnfollowed.id
            }
          })
          if (follow?.bskyUri) {
            const user = await User.findByPk(posterId)
            if (user) {
              const agent = await getAtProtoSession(user)
              await agent.deleteFollow(follow.bskyUri)
              await forceUpdateCacheDidsAtThread()
              await getCacheAtDids(true)
            }
          }
          userUnfollowed.removeFollower(posterId)
          redisCache.del('follows:full:' + posterId)
          redisCache.del('follows:local:' + posterId)
          redisCache.del('follows:notYetAcceptedFollows:' + posterId)
          success = true
        }
      }
    } catch (error) {
      logger.error(error)
    }

    res.send({
      success
    })
  })

  app.post('/api/muteRewoots', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false

    const posterId = req.jwtData?.userId
    const muteQuotes = req.body?.muteQuotes
    const userId = req.body?.userId
    if (posterId && userId) {
      const existingFollow = await Follows.findOne({
        where: {
          followerId: posterId,
          followedId: userId
        }
      })
      if (existingFollow) {
        success = true
        if (!muteQuotes) {
          existingFollow.muteRewoots = !existingFollow.muteRewoots
        } else {
          existingFollow.muteQuotes = !existingFollow.muteQuotes
        }
        await existingFollow.save()
      }
    }
    if (!success) {
      res.status(400)
    }
    res.send({
      success
    })
  })
}

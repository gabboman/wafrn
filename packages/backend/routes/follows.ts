import { Application, Response } from 'express'
import { Blocks, Follows, User } from '../db.js'
import { authenticateToken } from '../utils/authenticateToken'

import getBlockedIds from '../utils/cacheGetters/getBlockedIds.js'
import { logger } from '../utils/logger.js'
import { remoteFollow } from '../utils/activitypub/remoteFollow.js'
import { remoteUnfollow } from '../utils/activitypub/remoteUnfollow'
import { Op, Sequelize } from 'sequelize'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { follow } from '../utils/follow'
import { redisCache } from '../utils/redis.js'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds.js'
import { getNotYetAcceptedFollowedids } from '../utils/cacheGetters/getNotYetAcceptedFollowedIds'
import { getUserOptions } from '../utils/cacheGetters/getUserOptions.js'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts'
import { environment } from '../environment.js'

export default function followsRoutes(app: Application) {
  app.post('/api/follow', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const posterId = req.jwtData?.userId ? req.jwtData.userId : environment.deletedUser
      const options = await getUserOptions(posterId)
      const userFederatesWithThreads = options.filter(
        (elem) => elem.optionName === 'wafrn.federateWithThreads' && elem.optionValue === 'true'
      )
      if (userFederatesWithThreads.length === 0) {
        const userToBeFollowed = await User.findByPk(req.body.userId)
        if (userToBeFollowed.urlToLower.endsWith('threads.net')) {
          res.status(500)
          res.send({
            error: true,
            message: 'You are trying to follow a threads user but you did not enable threads federation'
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
        const userUnfollowed = await User.findOne({
          where: {
            id: req.body.userId
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

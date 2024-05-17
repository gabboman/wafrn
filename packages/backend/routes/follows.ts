import { Application, Response } from 'express'
import { Blocks, Follows, User } from '../db'
import { authenticateToken } from '../utils/authenticateToken'

import getBlockedIds from '../utils/cacheGetters/getBlockedIds'
import { logger } from '../utils/logger'
import { remoteFollow } from '../utils/activitypub/remoteFollow'
import { remoteUnfollow } from '../utils/activitypub/remoteUnfollow'
import { Op, Sequelize } from 'sequelize'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { follow } from '../utils/follow'
import { redisCache } from '../utils/redis'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds'
import { getNotYetAcceptedFollowedids } from '../utils/cacheGetters/getNotYetAcceptedFollowedIds'
import { getUserOptions } from '../utils/cacheGetters/getUserOptions'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts'

export default function followsRoutes(app: Application) {
  app.post('/api/follow', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const posterId = req.jwtData?.userId
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

  // TODO: Remove this function because new route provides everything.
  app.get('/api/getFollowedUsers', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const followedUsers = getFollowedsIds(req.jwtData?.userId as string)
    const blockedUsers = getBlockedIds(req.jwtData?.userId as string)
    const notAcceptedFollows = getNotYetAcceptedFollowedids(req.jwtData?.userId as string)
    const options = getUserOptions(req.jwtData?.userId as string)
    let user = User.findByPk(req.jwtData?.userId, {
      attributes: ['banned']
    })
    const silencedPosts = getMutedPosts(req.jwtData?.userId as string)
    Promise.all([user, followedUsers, blockedUsers, user, notAcceptedFollows, options, silencedPosts])
    user = await user
    if (!user || user.banned) {
      res.sendStatus(401)
    } else {
      res.send({
        followedUsers: await followedUsers,
        blockedUsers: await blockedUsers,
        notAcceptedFollows: await notAcceptedFollows,
        options: await options,
        silencedPosts: await silencedPosts
      })
    }
  })
}

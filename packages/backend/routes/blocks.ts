import { Application, Response } from 'express'
import { User, Blocks } from '../db'
import { authenticateToken } from '../utils/authenticateToken'
import { logger } from '../utils/logger'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { redisCache } from '../utils/redis'

export default function blockRoutes(app: Application) {
  app.post('/api/block', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const posterId = req.jwtData?.userId
      const userBlocker = await User.findByPk(posterId)
      if (req.body?.userId && req.body.userId != req.jwtData?.userId) {
        const userToBeBlocked = await User.findByPk(req.body.userId)
        if (userToBeBlocked) {
          userToBeBlocked.addBlocker(userBlocker)
          userToBeBlocked.removeFollowed(userBlocker)
          userBlocker.removeFollowed(userToBeBlocked)
        }

        success = true
        redisCache.del('blocks:' + posterId)
        redisCache.del('blocks:' + req.body.userId)
        redisCache.del('follows:full:' + posterId)
        redisCache.del('follows:local:' + posterId)
        redisCache.del('follows:full:' + req.body.userId)
        redisCache.del('follows:local:' + req.body.userId)
        redisCache.del('follows:notYetAcceptedFollows:' + req.body.userId)
      }
    } catch (error) {
      logger.error(error)
    }

    res.send({
      success
    })
  })

  app.post('/api/unblock', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const posterId = req.jwtData?.userId
    if (req.body?.userId) {
      const userUnblocked = await User.findByPk(req.body.userId)
      userUnblocked.removeBlocker(posterId)
      success = true
    }

    res.send({
      success
    })
    redisCache.del('blocks:' + posterId)
    redisCache.del('blocks:' + req.body.userId)
    redisCache.del('follows:full:' + posterId)
    redisCache.del('follows:local:' + posterId)
    redisCache.del('follows:full:' + req.body.userId)
    redisCache.del('follows:local:' + req.body.userId)
    redisCache.del('follows:notYetAcceptedFollows:' + req.body.userId)
  })

  async function myBlocks(id: string) {
    return Blocks.findAll({
      where: {
        blockerId: id
      },
      attributes: ['reason', 'createdAt'],
      include: [
        {
          model: User,
          as: 'blocked',
          attributes: ['id', 'url', 'avatar', 'description']
        }
      ]
    })
  }

  app.get('/api/myBlocks', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const posterId = req.jwtData?.userId as string
    const blocks = await myBlocks(posterId)
    res.send(blocks)
  })

  app.post('/api/unblock-user', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userToBeUnblockedId = req.query.id
    const userUnblockerId = req.jwtData?.userId as string
    const tmp = await Blocks.destroy({
      where: {
        blockedId: userToBeUnblockedId,
        blockerId: userUnblockerId
      }
    })
    res.send(await myBlocks(userUnblockerId))
  })
}

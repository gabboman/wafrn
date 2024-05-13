import { Application, Response } from 'express'
import { User, Mutes, FederatedHost, ServerBlock } from '../db'
import { authenticateToken } from '../utils/authenticateToken'
import { logger } from '../utils/logger'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { redisCache } from '../utils/redis'

export default function blockUserServerRoutes(app: Application) {
  app.post('/api/blockUserServer', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const posterId = req.jwtData?.userId
      const userBlocker = await User.findByPk(posterId)
      if (req.body?.userId) {
        const userToGetServerBlocked = await User.findByPk(req.body.userId, {
          include: [
            {
              model: FederatedHost
            }
          ]
        })
        if (userToGetServerBlocked) {
          await ServerBlock.create({
            userBlockerId: userBlocker.id,
            blockedServerId: userToGetServerBlocked.federatedHost.id
          })
        }
        redisCache.del('serverblocks:' + userBlocker.id)

        success = true
      }
    } catch (error) {
      logger.error(error)
    }

    res.send({
      success
    })
  })

  app.post('/api/unblockUserServer', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const posterId = req.jwtData?.userId
    if (req.body?.userId) {
      const userUnmuted = await User.findByPk(req.body.userId)
      userUnmuted.removeMuter(posterId)
      success = true
    }
    res.send({
      success
    })
    redisCache.del('serverblocks:' + posterId)
  })

  async function myServerBlocks(id: string) {
    return ServerBlock.findAll({
      where: {
        userBlockerId: id
      },
      attributes: ['createdAt'],
      include: [
        {
          model: FederatedHost,
          as: 'blockedServer',
          attributes: ['id', 'displayName']
        }
      ]
    })
  }

  app.get('/api/myServerBlocks', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const posterId = req.jwtData?.userId as string
    const blocks = await myServerBlocks(posterId)
    res.send(blocks)
  })

  app.post('/api/unblockServer', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const serverToBeUnblocked = req.query.id
    const userUnblocker = req.jwtData?.userId as string
    await ServerBlock.destroy({
      where: {
        blockedServerId: serverToBeUnblocked,
        userBlockerId: userUnblocker
      }
    })
    res.send(await myServerBlocks(userUnblocker))
  })
}

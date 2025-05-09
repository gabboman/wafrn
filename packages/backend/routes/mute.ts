import { Application, Response } from 'express'
import { User, Mutes } from '../models/index.js'
import { authenticateToken } from '../utils/authenticateToken.js'
import { logger } from '../utils/logger.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { redisCache } from '../utils/redis.js'

export default function muteRoutes(app: Application) {
  app.post('/api/mute', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const posterId = req.jwtData?.userId as string
      const userMuter = await User.findByPk(posterId)
      if (req.body?.userId && req.body.userId != req.jwtData?.userId) {
        const userToBeMuted = await User.findByPk(req.body.userId)
        if (userMuter && userToBeMuted) {
          userToBeMuted.addMuter(userMuter)
        }
        await redisCache.del('mutedUsers:' + posterId)
        success = true
      }
    } catch (error) {
      logger.error(error)
    }

    res.send({
      success
    })
  })

  app.post('/api/unmute', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const posterId = req.jwtData?.userId
    if (req.body?.userId) {
      const userUnmuted = await User.findByPk(req.body.userId)
      if (userUnmuted) {
        userUnmuted.removeMuter(posterId)
        success = true
        await redisCache.del('mutedUsers:' + posterId)
      }
    }
    res.send({
      success
    })
  })

  async function myMutes(id: string) {
    return Mutes.findAll({
      where: {
        muterId: id
      },
      attributes: ['reason', 'createdAt'],
      include: [
        {
          model: User,
          as: 'muted',
          attributes: ['id', 'url', 'avatar', 'description']
        }
      ]
    })
  }

  app.get('/api/myMutes', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const posterId = req.jwtData?.userId as string
    const mutes = await myMutes(posterId)
    res.send(mutes)
  })

  app.post('/api/unmute-user', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userToBeUnmuted = req.query.id as string
    const userUnmuterId = req.jwtData?.userId as string
    await Mutes.destroy({
      where: {
        mutedId: userToBeUnmuted,
        muterId: userUnmuterId
      }
    })
    res.send(await myMutes(userUnmuterId))
  })
}

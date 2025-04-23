import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { environment } from '../environment.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { User } from '../models/index.js'
import { Op } from 'sequelize'
import { redisCache } from './redis.js'

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (token == null) return res.sendStatus(401)
  // TODO make this code "a bit better" and less duplicate. Not big deal because this code should not be touched.... but you know
  jwt.verify(token, environment.jwtSecret as string, async (err: any, jwtData: any) => {
    if (err) {
      return res.sendStatus(401)
    }
    if (!jwtData?.userId) {
      return res.sendStatus(401)
    }
    const userCacheHit = await redisCache.get('auth:' + jwtData.userId)
    if (userCacheHit) {
      ; (req as AuthorizedRequest).jwtData = jwtData
      next()
    } else {
      const user = await User.findOne({
        attributes: ['id', 'banned', 'activated'],
        where: {
          id: jwtData.userId,
          banned: { [Op.ne]: true },
          activated: true
        }
      })
      if (user) {
        // a ban can take up to 5 minutes on some view only routes
        await redisCache.set('auth:' + jwtData.userId, 't', 'EX', 300)
          ; (req as AuthorizedRequest).jwtData = jwtData
        next()
      } else {
        return res.sendStatus(401)
      }
    }
  })
}

function adminToken(req: AuthorizedRequest, res: Response, next: NextFunction) {
  if (req.jwtData?.role === 10) {
    next()
  } else {
    return res.sendStatus(401)
  }
}

export { authenticateToken, adminToken }

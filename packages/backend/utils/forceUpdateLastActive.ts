import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { completeEnvironment } from './backendOptions.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { User } from '../models/index.js'

function forceUpdateLastActive(req: AuthorizedRequest, res: Response, next: NextFunction) {
  const userId = req.jwtData?.userId
  if (userId) {
    User.findByPk(userId).then(async (user) => {
      if (user) {
        user.lastActiveAt = new Date()
        await user.save()
      }
    })
    next()
  } else {
    res.sendStatus(401)
  }
}

export { forceUpdateLastActive }

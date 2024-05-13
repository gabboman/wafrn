import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { environment } from '../environment'
import AuthorizedRequest from '../interfaces/authorizedRequest'

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (token == null) return res.sendStatus(401)

  jwt.verify(token, environment.jwtSecret as string, (err: any, jwtData: any) => {
    if (err) {
      return res.sendStatus(403)
    }
    ;(req as AuthorizedRequest).jwtData = jwtData
    next()
  })
}

function adminToken(req: AuthorizedRequest, res: Response, next: NextFunction) {
  if (req.jwtData?.role === 10) {
    next()
  } else {
    return res.sendStatus(403)
  }
}

export { authenticateToken, adminToken }

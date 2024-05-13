import { Request, Response, NextFunction } from 'express'
const jwt = require('jsonwebtoken')
import { environment } from '../environment'

export default function optionalAuthentication(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]

    jwt.verify(token, environment.jwtSecret as string, (err: any, jwtData: any) => {
      if (err) {
        ;(req as any).jwtData = false
      }

      ;(req as any).jwtData = jwtData
    })
  } catch (error) {
    ;(req as any).jwtData = false
  }
  next()
}

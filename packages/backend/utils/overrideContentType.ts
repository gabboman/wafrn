import { Request, Response, NextFunction } from 'express'
import { logger } from './logger'

export default function overrideContentType(req: Request, res: Response, next: NextFunction) {
  const UrlPath = req.path
  if (UrlPath.startsWith('/fediverse')) {
    req.headers['content-type'] = 'application/json;charset=UTF-8'
  }
  next()
}

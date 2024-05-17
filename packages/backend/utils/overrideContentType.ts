import { Request, Response, NextFunction } from 'express'
import { logger } from './logger'

export default function overrideContentType(req: Request, res: Response, next: NextFunction) {
  const UrlPath = req.path
  if (UrlPath.startsWith('/fediverse')) {
    req.headers['content-type'] = 'application/json;charset=UTF-8'
  }
  if (req.headers.accept?.includes('*/*') && req.method === 'GET') {
    // its an user asking for the location
    if (UrlPath.startsWith('/fediverse/')) {
      logger.trace(`Redirecting ${req.header('accept')}`)
      res.redirect(UrlPath.split('/fediverse')[1])
    } else {
      next()
    }
  } else {
    next()
  }
}

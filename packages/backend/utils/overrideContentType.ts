import { Request, Response, NextFunction } from 'express'
import { logger } from './logger'
import { SignedRequest } from '../interfaces/fediverse/signedRequest'

export default function overrideContentType(req: SignedRequest, res: Response, next: NextFunction) {
  const UrlPath = req.path
  req.headers['content-type'] = 'application/json;charset=UTF-8'
  next()
}

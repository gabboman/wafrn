import { Request, Response, NextFunction } from 'express'
import { environment } from '../environment.js'
import getIp from './getIP.js'

export default function checkIpBlocked(req: Request, res: Response, next: NextFunction) {
  const petitionIp = getIp(req)
  if (environment.blockedIps.includes(petitionIp)) {
    res.status(401),
      res.send({
        message:
          'Hello, you seem to be scrapping us. Please contact the administrator',
        have_a_good_day: true
      })
  } else {
    next()
  }
}

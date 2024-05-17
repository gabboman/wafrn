import { Request, Response, NextFunction } from 'express'
import { environment } from '../environment'
import getIp from './getIP'

export default function checkIpBlocked(req: Request, res: Response, next: NextFunction) {
  const petitionIp = getIp(req)
  if (environment.blockedIps.includes(petitionIp)) {
    res.send({
      message:
        'Hello, so would you mind sending me an email explaining why the spam or scrapping? Just I want to know. Have a good day. Remember info@wafrn.net',
      matrix: 'I also have matrix @gabboman92:matrix.org',
      discord:
        'my discord is gabboman92 but please if you have gone through the effort of scraping wafrn please be fun and use matrix',
      have_a_good_day: true
    })
  } else {
    next()
  }
}

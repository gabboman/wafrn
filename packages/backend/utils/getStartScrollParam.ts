import { Request } from 'express'

export default function getStartScrollParam(req: Request) {
  // read the date in ms from the url search params
  const dateMS = Number(req.query.startScroll)
  return new Date(dateMS || Date.now())
}

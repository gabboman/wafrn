import { Request } from 'express'

export interface SignedRequest extends Request {
  fediData?: {
    fediHost: string
    remoteUserUrl: string
  }
  rawBody?: string
}

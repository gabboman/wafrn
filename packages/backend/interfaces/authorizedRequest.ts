import { Request } from 'express'

export default interface AuthorizedRequest extends Request {
  jwtData?: {
    userId: string
    email: string
    birthDate: string
    url: string
    role: number
  }
}

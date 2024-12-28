import { SimplifiedUser } from './simplified-user'

export interface Ask {
  id: string
  userAsker: string
  question: string
  apObject: string
  user?: SimplifiedUser
  postId?: string
}

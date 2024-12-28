import { SimplifiedUser } from './simplified-user'

export interface followsResponse extends SimplifiedUser {
  follows: {
    remoteFollowId?: any

    accepted: boolean

    createdAt: string

    updatedAt: string

    followerId: string

    followedId: string
  }
}

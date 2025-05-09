import { Emoji } from './emoji'
import { FederatedHost } from './federatedHost'
import { PublicOption } from './publicOption'

export interface BlogDetails {
  id: string
  url: string
  name: string
  createdAt: string
  description: string
  descriptionMarkdown: string
  remoteId: string
  avatar: string
  federatedHostId: string
  headerImage: string
  followingCount: number
  followerCount: number
  manuallyAcceptsFollows: boolean
  emojis: Emoji[]
  federatedHost?: FederatedHost
  muted: boolean
  blocked: boolean
  serverBlocked: boolean
  followed: number
  followers: number
  publicOptions: PublicOption[]
  postCount: number
  isBlueskyUser: boolean
  disableEmailNotifications: boolean // do not worry the backend checks if the user asking is you or not
  hideFollows: boolean
  hideProfileNotLoggedIn: boolean
}

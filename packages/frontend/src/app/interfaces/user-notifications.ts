import { NotificationType } from '../enums/notification-type'
import { Emoji } from './emoji'
import { ProcessedPost } from './processed-post'

export interface UserNotifications {
  url: string
  avatar: string
  userUrl: string
  userName: string
  date: Date
  type: NotificationType
  emojiReact?: Emoji
  emojiName?: string
  fragment?: ProcessedPost
}

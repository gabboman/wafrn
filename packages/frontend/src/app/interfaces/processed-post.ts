import { Ask } from './ask'
import { Emoji } from './emoji'
import { QuestionPoll } from './questionPoll'
import { RawPost } from './raw-post'
import { SimplifiedUser } from './simplified-user'
import { Tag } from './tag'
import { PostEmojiReaction } from './unlinked-posts'
import { WafrnMedia } from './wafrn-media'

export interface ProcessedPost {
  id: string
  content_warning: string
  muted_words_cw?: string
  content: string
  title?: string
  createdAt: Date
  updatedAt: Date
  userId: string
  user: SimplifiedUser
  medias: WafrnMedia[]
  tags: Tag[]
  mentionPost?: SimplifiedUser[]
  notes: number
  privacy: number
  remotePostId: string
  userLikesPostRelations: string[]
  emojis: Emoji[]
  descendents: RawPost[]
  questionPoll?: QuestionPoll
  emojiReactions: PostEmojiReaction[]
  quotes: ProcessedPost[]
  parentCollection: ProcessedPost[]
  parentId?: string
  ask?: Ask
  markdownContent: string
  bskyUri?: string
  isRewoot: boolean
  hierarchyLevel: number
  bookmarkers: string[]
  canReply: boolean
  canQuote: boolean
  canLike: boolean
  canReblog: boolean
}

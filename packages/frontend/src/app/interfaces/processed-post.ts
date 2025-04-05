import { SimplifiedUser } from './simplified-user'
import { WafrnMedia } from './wafrn-media'
import { Tag } from './tag'
import { WafrnMention } from './wafrn-mention'
import { Emoji } from './emoji'
import { RawPost } from './raw-post'
import { QuestionPoll } from './questionPoll'
import { PostEmojiReaction } from './unlinked-posts'
import { Ask } from './ask'

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
  parentId?: string
  ask?: Ask
  markdownContent: string
  bskyUri?: string
  isRewoot: boolean
  hierarchyLevel: number
}

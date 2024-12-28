import { Ask } from './ask'
import { Emoji } from './emoji'
import { SimplifiedUser } from './simplified-user'

export interface unlinkedPosts {
  posts: basicPost[]
  emojiRelations: EmojiRelations
  mentions: Mention[]
  users: SimplifiedUser[]
  polls: Poll[]
  medias: Media[]
  tags: Tag[]
  likes: Like[]
  lastPostDate: Date
  quotes: Quote[]
  quotedPosts: basicPost[]
  rewootIds: string[]
  asks?: Ask[]
}

export interface basicPost {
  len?: number
  id: string
  content_warning: string
  content: string
  title?: string
  remotePostId?: string
  privacy: number
  featured: boolean
  createdAt: string
  updatedAt: string
  userId: string
  hierarchyLevel: number
  parentId?: string
  ancestors: basicPost[]
  notes?: number
  quotes?: basicPost[]
  markdownContent: string
}

interface EmojiRelations {
  userEmojiRelation: UserEmojiRelation[]
  postEmojiRelation: PostEmojiRelation[]
  postEmojiReactions: PostEmojiReaction[]
  emojis: Emoji[]
}

export interface Quote {
  quotedPostId: string
  quoterPostId: string
  createdAt: Date
}

interface PostEmojiRelation {
  emojiId: string
  postId: string
}

interface UserEmojiRelation {
  userId: string
  emojiId: string
}

export interface PostEmojiReaction {
  emojiId: string
  postId: string
  userId: string
  content: string
  emoji?: Emoji
  user?: SimplifiedUser
}

interface Mention {
  userMentioned: string
  post: string
}

interface Media {
  mediaOrder: any
  id: string
  NSFW: boolean
  description: string
  url: string
  external: boolean
  postId: string
  mediaType: string
}

interface Tag {
  postId: string
  tagName: string
}

interface Like {
  userId: string
  postId: string
}

interface Poll {
  id: number

  endDate: string

  multiChoice: boolean

  createdAt: string

  updatedAt: string

  postId: string

  questionPollQuestions: QuestionPollQuestion[]
}

interface QuestionPollQuestion {
  id: number

  questionText: string

  index: number

  remoteReplies: number

  createdAt: string

  updatedAt: string

  questionPollId: number

  questionPollAnswers: any[]
}

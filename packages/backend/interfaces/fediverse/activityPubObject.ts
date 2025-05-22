import { fediverseTag } from './tags.js'

export interface activityPubObject {
  '@context': string | any[]
  actor: string
  to?: string[]
  cc?: string[]
  id: string
  type: string
  published?: Date | string
  object?: any
  tag?: fediverseTag[]
  content?: string
  target?: string
}

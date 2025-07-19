import { completeEnvironment } from '../backendOptions.js'
import { fediverseTag } from '../../interfaces/fediverse/tags.js'

function emojiToAPTag(emoji: any): fediverseTag {
  return {
    icon: {
      mediaType: `image/png`,
      type: 'Image',
      url: completeEnvironment.mediaUrl + emoji.url
    },
    id: completeEnvironment.frontendUrl + '/fediverse/emoji/' + emoji.id,
    name: emoji.name,
    type: 'Emoji',
    updated: emoji.updatedAt
  }
}

export { emojiToAPTag }

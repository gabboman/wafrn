import { environment } from "../../environment";
import { fediverseTag } from "../../interfaces/fediverse/tags";

function emojiToAPTag(emoji: any): fediverseTag {
    return {
        icon: {
          mediaType: `image/png`,
          type: 'Image',
          url: environment.mediaUrl + emoji.url,
        },
        id: environment.frontendUrl + '/fediverse/emoji/' + emoji.id,
        name: emoji.name,
        type: 'Emoji',
        updated: emoji.updatedAt
      }
}

export {emojiToAPTag}
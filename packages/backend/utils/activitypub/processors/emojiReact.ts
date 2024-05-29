import { Emoji, EmojiReaction } from '../../../db'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { getPostThreadRecursive } from '../getPostThreadRecursive'
import { signAndAccept } from '../signAndAccept'

async function EmojiReactActivity(body: any, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  const postToReact = await getPostThreadRecursive(user, apObject.object)
  let emojiToAdd: any
  if (apObject.tag && apObject.tag.length === 1 && apObject.tag[0]?.icon) {
    const emojiRemote = apObject.tag[0]
    const existingEmoji = await Emoji.findByPk(emojiRemote.id)
    emojiToAdd = existingEmoji
      ? existingEmoji
      : await Emoji.create({
          id: emojiRemote.id,
          name: emojiRemote.name,
          url: emojiRemote.icon?.url,
          external: true
        })
  }
  if (postToReact && apObject.content) {
    const existing = await EmojiReaction.findOne({
      where: {
        remoteId: apObject.id
      }
    })
    if (!existing) {
      await EmojiReaction.create({
        remoteId: apObject.id,
        userId: remoteUser.id,
        content: apObject.content,
        postId: postToReact.id,
        emojiId: emojiToAdd?.id
      })
    }
  }
  await signAndAccept({ body: body }, remoteUser, user)
}

export { EmojiReactActivity }

import { Emoji, EmojiReaction, Notification } from '../../../db.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { getPostThreadRecursive } from '../getPostThreadRecursive.js'
import { signAndAccept } from '../signAndAccept.js'

async function EmojiReactActivity(body: activityPubObject, remoteUser: any, user: any) {
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
      const reaction = await EmojiReaction.create({
        remoteId: apObject.id,
        userId: remoteUser.id,
        content: apObject.content,
        postId: postToReact.id,
        emojiId: emojiToAdd?.id
      })
      await Notification.create({
        notificationType: 'EMOJIREACT',
        userId: remoteUser.id,
        postId: postToReact.id,
        notifiedUserId: postToReact.userId,
        emojiReactionId: reaction.id
      })
    }
  }
  // await signAndAccept({ body: body }, remoteUser, user)
}

export { EmojiReactActivity }

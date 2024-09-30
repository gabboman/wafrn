import { Emoji, EmojiReaction, UserLikesPostRelations } from '../../../db.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { logger } from '../../logger.js'
import { getPostThreadRecursive } from '../getPostThreadRecursive.js'
import { signAndAccept } from '../signAndAccept.js'

async function LikeActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  const postToBeLiked = await getPostThreadRecursive(user, apObject.object)
  if (postToBeLiked) {
    if (apObject.content) {
      // GOD DAMMIT MISSKEY emojireact from misskey
      const existingReaction = await EmojiReaction.findOne({
        where: {
          remoteId: apObject.id
        }
      })
      const reaction = existingReaction
        ? existingReaction
        : await EmojiReaction.create({
          remoteId: apObject.id,
          content: apObject.content,
          userId: remoteUser.id,
          postId: postToBeLiked.id
        })
      if (apObject.tag) {
        const emojiRemote = apObject.tag[0]
        const existingEmoji = await Emoji.findByPk(emojiRemote.id)
        const emojiToAdd = existingEmoji
          ? existingEmoji
          : await Emoji.create({
            id: emojiRemote.id,
            name: emojiRemote.name,
            url: emojiRemote.icon?.url,
            external: true
          })
        reaction.emojiId = emojiToAdd.id
        await reaction.save()
      }
    } else {
      try {
        const like = await UserLikesPostRelations.create({
          userId: remoteUser.id,
          postId: postToBeLiked.id,
          remoteId: apObject.id
        })
      } catch (error) {
        logger.trace(`Error processing like user ${remoteUser.url} post ${postToBeLiked.id} ${apObject.id}`)
      }
    }
    // await signAndAccept({ body: body }, remoteUser, user)
  }
}

export { LikeActivity }

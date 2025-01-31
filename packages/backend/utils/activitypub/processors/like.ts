import { Emoji, EmojiReaction, Notification, UserLikesPostRelations } from '../../../db.js'
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
      // a bit dirty but for notifications
      const reactionFound = !!existingReaction
      const reaction = existingReaction
        ? existingReaction
        : await EmojiReaction.create({
            remoteId: apObject.id,
            content: apObject.content,
            userId: remoteUser.id,
            postId: postToBeLiked.id
          })
      if (!reactionFound) {
        await Notification.create({
          notificationType: 'EMOJIREACT',
          userId: remoteUser.id,
          notifiedUserId: postToBeLiked.userId,
          postId: postToBeLiked.id,
          emojiReactionId: reaction.id
        })
      }
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
        const likeFound = await UserLikesPostRelations.findOrCreate({
          where: {
            userId: remoteUser.id,
            postId: postToBeLiked.id,
            remoteId: apObject.id
          }
        })
        if (likeFound[1]) {
          await Notification.create({
            notificationType: 'LIKE',
            userId: remoteUser.id,
            notifiedUserId: postToBeLiked.userId,
            postId: postToBeLiked.id
          })
        }
      } catch (error) {
        logger.trace(`Error processing like user ${remoteUser.url} post ${postToBeLiked.id} ${apObject.id}`)
      }
    }
    // await signAndAccept({ body: body }, remoteUser, user)
  }
}

export { LikeActivity }

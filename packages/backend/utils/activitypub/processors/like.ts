import { Emoji, EmojiReaction, Notification, User, UserLikesPostRelations } from '../../../models/index.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { logger } from '../../logger.js'
import { createNotification } from '../../pushNotifications.js'
import { getPostThreadRecursive } from '../getPostThreadRecursive.js'
import { signAndAccept } from '../signAndAccept.js'

async function LikeActivity(body: activityPubObject, remoteUser: User, user: User) {
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
        await createNotification(
          {
            notificationType: 'EMOJIREACT',
            userId: remoteUser.id,
            notifiedUserId: postToBeLiked.userId,
            postId: postToBeLiked.id,
            emojiReactionId: reaction.id
          },
          {
            postContent: postToBeLiked.content,
            userUrl: remoteUser.url,
            emoji: reaction.content
          }
        )
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
          await createNotification(
            {
              notificationType: 'LIKE',
              userId: remoteUser.id,
              notifiedUserId: postToBeLiked.userId,
              postId: postToBeLiked.id
            },
            {
              postContent: postToBeLiked.content,
              userUrl: remoteUser.url
            }
          )
        }
      } catch (error) {
        logger.trace(`Error processing like user ${remoteUser.url} post ${postToBeLiked.id} ${apObject.id}`)
      }
    }
    // await signAndAccept({ body: body }, remoteUser, user)
  }
}

export { LikeActivity }

import { Application, Response } from 'express'
import { authenticateToken } from '../utils/authenticateToken.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { Emoji, EmojiReaction, Post, User } from '../models/index.js'
import { logger } from '../utils/logger.js'
import { emojiReactRemote } from '../utils/activitypub/likePost.js'
import { getUserOptions } from '../utils/cacheGetters/getUserOptions.js'
import { forceUpdateLastActive } from '../utils/forceUpdateLastActive.js'
import { createNotification } from '../utils/pushNotifications.js'

export default function emojiReactRoutes(app: Application) {
  app.post(
    '/api/emojiReact',
    authenticateToken,
    forceUpdateLastActive,
    async (req: AuthorizedRequest, res: Response) => {
      let success = false
      const userId = req.jwtData?.userId
      const postId = req.body.postId
      const emojiName = req.body.emojiName
      const undo = req.body.undo
      if(emojiName.length > 768) {
        res.status(400)
        return res.send({
          success: false,
          message: `You sent an emojireact with a lenght of ${emojiName.lenght}`
        })
      }
      if (undo) {
        const reaction = await EmojiReaction.findOne({
          where: {
            userId: userId,
            postId: postId,
            content: emojiName
          }
        })
        if (reaction) {
          await emojiReactRemote(reaction, true)
          await reaction.destroy()
          success = true
        }

        res.send({
          success: success
        })
        return
      }

      const userPromise = User.findByPk(userId)
      const postPromise = Post.findByPk(postId)
      let emojiOrig = await Emoji.findByPk(emojiName)
      let emoji =
        emojiName.startsWith(':') && emojiName.endsWith(':')
          ? emojiOrig
          : {
              id: emojiName,
              name: null
            }
      if (emoji) {
        try {
          const existing = EmojiReaction.findOne({
            where: {
              userId: userId,
              postId: postId,
              emojiId: emoji.id
            }
          })
          await Promise.all([userPromise, postPromise, emoji, existing])
          let user = await userPromise
          let post = await postPromise
          if (userId && user && post && !(await existing)) {
            const options = await getUserOptions(user.id)
            const userFederatesWithThreads = options.filter(
              (elem) => elem.optionName === 'wafrn.federateWithThreads' && elem.optionValue === 'true'
            )
            if (userFederatesWithThreads.length === 0) {
              const userOfPostToBeReacted = await User.findByPk(post.userId)
              if (userOfPostToBeReacted?.url.toLowerCase().endsWith('.threads.net')) {
                res.sendStatus(500)
                return
              }
            }
            const reaction = await EmojiReaction.create({
              userId: userId,
              postId: postId,
              emojiId: emoji.name ? emoji.name : undefined,
              content: emoji.name ? emoji.name : emojiName
            })
            await reaction.save()
            await createNotification(
              {
                notificationType: 'EMOJIREACT',
                userId: userId,
                postId: postId,
                notifiedUserId: post.userId,
                emojiReactionId: reaction.id,
                createdAt: new Date(reaction.createdAt)
              },
              {
                postContent: post?.content,
                userUrl: user?.url,
                emoji: reaction.content
              }
            )
            success = true
            emojiReactRemote(reaction)
          }
          if (await existing) {
            success = true
          }
        } catch (error) {
          logger.debug(error)
        }
      }

      res.send({ success: success })
    }
  )
}

export { emojiReactRoutes }

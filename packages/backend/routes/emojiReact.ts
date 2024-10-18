import { Application, Response } from 'express'
import { authenticateToken } from '../utils/authenticateToken.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { Emoji, EmojiReaction, Post, User } from '../db.js'
import { logger } from '../utils/logger.js'
import { emojiReactRemote } from '../utils/activitypub/likePost.js'
import { getUserOptions } from '../utils/cacheGetters/getUserOptions.js'

export default function emojiReactRoutes(app: Application) {
  app.post('/api/emojiReact', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const userId = req.jwtData?.userId
    const postId = req.body.postId
    const emojiName = req.body.emojiName
    const undo = req.body.undo
    if (undo) {
      // TODO not yet implemented lol
      res.sendStatus(500)
      return
    }

    const user = User.findByPk(userId)
    const post = Post.findByPk(postId)
    let emoji = await Emoji.findByPk(emojiName)
    emoji =
      emojiName.startsWith(':') && emojiName.endsWith(':')
        ? emoji
        : {
          id: emojiName
          // name: emojiName
        }
    const existing = EmojiReaction.findOne({
      where: {
        userId: userId,
        postId: postId,
        emojiId: emoji.id
      }
    })
    try {
      await Promise.all([user, post, emoji, existing])
      if ((await user) && (await post) && !(await existing)) {
        const options = await getUserOptions((await user).id)
        const userFederatesWithThreads = options.filter(
          (elem) => elem.optionName === 'wafrn.federateWithThreads' && elem.optionValue === 'true'
        )
        if (userFederatesWithThreads.length === 0) {
          const userOfPostToBeReacted = await User.findByPk((await post).userId)
          if (userOfPostToBeReacted.url.toLowerCase().endsWith('threads.net')) {
            res.sendStatus(500)
            return
          }
        }
        const reaction = await EmojiReaction.create({
          userId: userId,
          postId: postId,
          emojiId: (await emoji).name ? emoji.name : null,
          content: (await emoji).name ? emoji.name : emojiName
        })
        await reaction.save()
        success = true
        emojiReactRemote(reaction)
      }
      if (await existing) {
        success = true
      }
    } catch (error) {
      logger.debug(error)
    }
    res.send({ success: success })
  })
}

export { emojiReactRoutes }

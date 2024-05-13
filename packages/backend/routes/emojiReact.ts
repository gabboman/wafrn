import { Application, Response } from "express"
import { authenticateToken } from "../utils/authenticateToken"
import AuthorizedRequest from "../interfaces/authorizedRequest"
import { Emoji, EmojiReaction, Post, User } from "../db"
import { logger } from "../utils/logger"
import { emojiReactRemote } from "../utils/activitypub/likePost"

export default function emojiReactRoutes(app: Application) {
    app.post('/api/emojiReact', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
      let success = false
      const userId = req.jwtData?.userId
      const postId = req.body.postId
      const emojiName = req.body.emojiName
      const undo = req.body.undo
      if(undo) {
        // TODO not yet implemented lol
        res.sendStatus(500);
        return;
      }
  
      const user = User.findByPk(userId)
      const post = Post.findByPk(postId)
      const emoji = await Emoji.findByPk(emojiName) // our special emojis share name and id, remote ones should not
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
          const reaction = await EmojiReaction.create({
            userId: userId,
            postId: postId,
            emojiId: (await emoji) ? emoji.name : null,
            content:  (await emoji) ? emoji.name : emojiName
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

export {emojiReactRoutes}
import { Application, Response } from 'express'
import { authenticateToken } from '../utils/authenticateToken'

import { Post, User, UserLikesPostRelations } from '../db'
import { logger } from '../utils/logger'
import { likePostRemote } from '../utils/activitypub/likePost'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { getUserOptions } from '../utils/cacheGetters/getUserOptions'

export default function likeRoutes(app: Application) {
  app.post('/api/like', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const userId = req.jwtData?.userId
    const postId = req.body.postId

    const user = User.findOne({
      where: {
        id: userId
      }
    })
    const post = Post.findOne({
      where: {
        id: postId
      }
    })
    const like = UserLikesPostRelations.findOne({
      where: {
        userId: userId,
        postId: postId
      }
    })
    try {
      await Promise.all([user, post, like])
      if ((await user) && (await post) && !(await like)) {
        const options = await getUserOptions(user.id)
        const userFederatesWithThreads = options.filter(elem => elem.optionName === 'wafrn.federateWithThreads' && elem.optionValue === 'true')
        if(userFederatesWithThreads.length === 0) {
          const userPosterOfPostToBeLiked = await User.findByPk(post.userId)
          if(userPosterOfPostToBeLiked.urlToLower.endsWith('threads.net')) {
            res.sendStatus(500);
            return;
          }
        }
        const likedPost = await UserLikesPostRelations.create({
          userId: userId,
          postId: postId
        })
        await likedPost.save()
        success = true
        likePostRemote(likedPost)
      }
      if (await like) {
        success = true
      }
    } catch (error) {
      logger.debug(error)
    }
    res.send({ success: success })
  })

  app.post('/api/unlike', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const userId = req.jwtData?.userId
    const postId = req.body.postId
    const like = await UserLikesPostRelations.findOne({
      where: {
        userId: userId,
        postId: postId
      }
    })
    if (like) {
      likePostRemote(like, true)
      await like.destroy()
    }
    success = true
    res.send({ success: success })
  })
}

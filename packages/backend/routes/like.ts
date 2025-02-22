import { Application, Response } from 'express'
import { authenticateToken } from '../utils/authenticateToken.js'

import { Notification, Post, User, UserLikesPostRelations } from '../db.js'
import { logger } from '../utils/logger.js'
import { likePostRemote } from '../utils/activitypub/likePost.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { getUserOptions } from '../utils/cacheGetters/getUserOptions.js'
import { getAtProtoSession } from '../atproto/utils/getAtProtoSession.js'
import { Model } from 'sequelize'
import { forceUpdateLastActive } from '../utils/forceUpdateLastActive.js'
import { createNotification } from '../utils/pushNotifications.js'

export default function likeRoutes(app: Application) {
  app.post('/api/like', authenticateToken, forceUpdateLastActive, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const userId = req.jwtData?.userId
    const postId = req.body.postId
    let bskyUri = undefined
    const user = User.findOne({
      where: {
        id: userId
      }
    })
    const post = await Post.findOne({
      where: {
        id: postId
      }
    })
    const like = await UserLikesPostRelations.findOne({
      where: {
        userId: userId,
        postId: postId
      }
    })
    try {
      await Promise.all([user, post, like])
      if ((await user) && (await post) && !(await like)) {
        const options = await getUserOptions((await user).id)
        const userFederatesWithThreads = options.filter(
          (elem) => elem.optionName === 'wafrn.federateWithThreads' && elem.optionValue === 'true'
        )
        if (userFederatesWithThreads.length === 0) {
          const userPosterOfPostToBeLiked = await User.findByPk((await post).userId)
          if (userPosterOfPostToBeLiked.url.toLowerCase().endsWith('threads.net')) {
            res.status(500)
            res.send({ error: true, message: 'You do not have threads federation enabled' })
            return
          }
        }
        if (!(await user)?.enableBsky && (await post)?.bskyUri) {
          const userPosterOfPostToBeLiked = await User.findByPk(((await post) as Model<any, any>).userId)
          if (userPosterOfPostToBeLiked.url.startsWith('@')) {
            res.status(500)
            res.send({ error: true, message: 'You do not have bluesky federation enabled' })
            return
          }
        } else {
          if ((await user).enableBsky && (await post).bskyUri) {
            const agent = await getAtProtoSession((await user) as Model<any, any>)
            const { uri } = await agent.like((await post).bskyUri, (await post).bskyCid)
            bskyUri = uri
          }
        }
        const likedPost = await UserLikesPostRelations.create({
          userId: userId,
          postId: postId,
          bskyPath: bskyUri
        })
        await likedPost.save()
        await createNotification(
          {
            notificationType: 'LIKE',
            notifiedUserId: post.userId,
            userId: userId,
            postId: postId
          },
          {
            postContent: post?.content,
            userUrl: (await user)?.url
          }
        )
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

  app.post('/api/unlike', authenticateToken, forceUpdateLastActive, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const userId = req.jwtData?.userId
    const postId = req.body.postId
    const like = await UserLikesPostRelations.findOne({
      where: {
        userId: userId,
        postId: postId
      }
    })
    await Notification.destroy({
      where: {
        notificationType: 'LIKE',
        userId: userId,
        postId: postId
      }
    })
    if (like && like.bskyPath) {
      const agent = await getAtProtoSession((await User.findByPk(userId)) as Model<any, any>)
      await agent.deleteLike(like.bskyPath)
    }
    if (like) {
      likePostRemote(like, true)
      await like.destroy()
      success = true
    }

    res.send({ success: success })
  })
}

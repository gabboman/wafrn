import { Application, Response } from 'express'
import { authenticateToken } from '../utils/authenticateToken'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts'
import { getUnjointedPosts } from '../utils/baseQueryNew'
import { Post, SilencedPost } from '../db'
import { redisCache } from '../utils/redis'

export default function silencePostRoutes(app: Application) {
  // to see your silenced posts we usethe dashboard endpoint with level 25

  app.post('/api/v2/unsilencePost', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId as string
    const idPostToUnsilence = req.body.postId
    if (idPostToUnsilence) {
      await SilencedPost.destroy({
        where: {
          userId: userId,
          postId: idPostToUnsilence
        }
      })
      await redisCache.del('mutedPosts:' + userId)
      res.send({ success: true })
    } else {
      res.send({
        success: false
      })
    }
  })

  app.post('/api/v2/silencePost', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId as string
    const idPostToUnsilence = req.body.postId

    if (idPostToUnsilence) {
      const postToSilence = await Post.findOne({
        where: {
          id: idPostToUnsilence,
          userId: userId
        }
      })
      // we need to check that the user is not adding to the list a post that is not theirs. If they could do that they could theoretically deanonimize posts
      if (postToSilence) {
        await SilencedPost.create({
          userId: userId,
          postId: idPostToUnsilence
        })
        await redisCache.del('mutedPosts:' + userId)
      }
      res.send({ success: true })
    } else {
      res.send({
        success: false
      })
    }
  })
}

export { silencePostRoutes }

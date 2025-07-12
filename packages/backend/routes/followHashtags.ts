import { Application, Response } from 'express'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { authenticateToken } from '../utils/authenticateToken.js'
import { UserFollowHashtags } from '../models/userFollowHashtag.js'
import { environment } from '../environment.js'
import { Queue } from 'bullmq'

export default function followHashtagRoutes(app: Application) {
  app.post('/api/followHashtag', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    if (req.body.hashtag && typeof req.body.hashtag === 'string') {
      const userId = req.jwtData?.userId as string
      await UserFollowHashtags.findOrCreate({
        where: {
          userId: userId,
          tagName: req.body.hashtag.toLowerCase()
        }
      })
      success = true
    }
    if (!success) {
      res.status(400)
    }
    await forceUpdateCacheDidsAtThread()

    res.send({ success: success })
  })

  app.post('/api/unfollowHashtag', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    if (req.body.hashtag && typeof req.body.hashtag === 'string') {
      const userId = req.jwtData?.userId as string
      let result = await UserFollowHashtags.destroy({
        where: {
          userId: userId,
          tagName: req.body.hashtag.toLowerCase()
        }
      })
      success = true
    }
    if (!success) {
      res.status(400)
    }
    await forceUpdateCacheDidsAtThread()
    res.send({ success: success })
  })

  app.get('/api/myFollowedHashtags', async (req: AuthorizedRequest, res: Response) => {
    res.send(
      await UserFollowHashtags.findAll({
        where: {
          userId: req.jwtData?.userId as string
        }
      })
    )
  })

  async function forceUpdateCacheDidsAtThread() {
    const forceUpdaDidsteQueue = new Queue('forceUpdateDids', {
      connection: environment.bullmqConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    })
    await forceUpdaDidsteQueue.add('forceUpdateDids', {})
  }
}

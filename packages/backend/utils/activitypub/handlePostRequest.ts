import { SignedRequest } from '../../interfaces/fediverse/signedRequest'
import { Response } from 'express'
import { getPostAndUserFromPostId } from '../cacheGetters/getPostAndUserFromPostId'
import { getFollowerRemoteIds } from '../cacheGetters/getFollowerRemoteIds'
import { logger } from '../logger'
import { postToJSONLD } from './postToJSONLD'
import { getRemoteActor } from './getRemoteActor'
import { Queue } from 'bullmq'
import { environment } from '../../environment'


const sendPostQueue = new Queue('processRemoteView', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 25000
    },
    removeOnFail: 25000
  }
})

async function handlePostRequest(req: SignedRequest, res: Response) {
  if (req.params?.id) {
    const cachePost = await getPostAndUserFromPostId(req.params.id)
    const post = cachePost.data
    if (post) {
      // we get remote user async-ly
      const fediData = req.fediData as {
        fediHost: string
        remoteUserUrl: string
        valid: boolean
      }
      getRemoteActor(fediData.remoteUserUrl, cachePost.data.user, false).then(async (remoteActor) => {
        const federatedHost = await remoteActor.getFederatedHost()
          await sendPostQueue.add('processPost', {
            postId: post.id,
            federatedHostId:  federatedHost.publicInbox ? federatedHost.id : '',
            userId: federatedHost.publicInbox ? '' : remoteActor.id
          })
      })
      const user = post.user
      if (user.url.startsWith('@')) {
        // EXTERNAL USER
        res.redirect(post.remotePostId)
        return
      }
      if (user.banned) {
        res.sendStatus(410)
        return
      }
      if (post.privacy === 1) {
        const followerIds = await getFollowerRemoteIds(user.id)
        try {
          if (
            !req.fediData?.valid ||
            !req.fediData?.remoteUserUrl ||
            (followerIds && !followerIds.include(req.fediData.remoteUserUrl))
          ) {
            res.sendStatus(404)
            return
          }
        } catch (error) {
          logger.warn({
            message: 'Error on post',
            postId: post.id,
            fediData: req.fediData,
            user: user.id,
            followerIds: followerIds,
            error: error
          })
          res.sendStatus(500)
          return
        }
      }

      res.set({
        'content-type': 'application/activity+json'
      })
      const response = await postToJSONLD(post.id)
      res.send({
        ...response.object,
        '@context': response['@context']
      })
    } else {
      res.sendStatus(404)
    }
  } else {
    res.sendStatus(404)
  }
  res.end()
}

export { handlePostRequest }

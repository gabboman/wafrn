import { SignedRequest } from '../../interfaces/fediverse/signedRequest'
import { Response } from 'express'
import { getPostAndUserFromPostId } from '../cacheGetters/getPostAndUserFromPostId'
import { getFollowerRemoteIds } from '../cacheGetters/getFollowerRemoteIds'
import { logger } from '../logger'
import { postToJSONLD } from './postToJSONLD'

async function handlePostRequest(req: SignedRequest, res: Response) {
  if (req.params?.id) {
    const cachePost = await getPostAndUserFromPostId(req.params.id)
    const post = cachePost.data
    if (post) {
      const user = post.user
      if (user.url.startsWith('@')) {
        // EXTERNAL USER LOL
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

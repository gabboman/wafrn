import { Application, Request, Response } from 'express'
import { User, Follows, Post, Media, UserLikesPostRelations, Emoji, UserEmojiRelation } from '../../db'
import { getCheckFediverseSignatureFucnction } from '../../utils/activitypub/checkFediverseSignature'
import { sequelize } from '../../db'
import { Op } from 'sequelize'
import { environment } from '../../environment'
import { return404 } from '../../utils/return404'
import { postToJSONLD } from '../../utils/activitypub/postToJSONLD'
import { Queue } from 'bullmq'
import { getLocalUserId } from '../../utils/cacheGetters/getLocalUserId'
import { SignedRequest } from '../../interfaces/fediverse/signedRequest'
import { emojiToAPTag } from '../../utils/activitypub/emojiToAPTag'
import { getPostReplies } from '../../utils/activitypub/getPostReplies'
import { redisCache } from '../../utils/redis'
import { getUserEmojis } from '../../utils/cacheGetters/getUserEmojis'
import { getFollowedRemoteIds } from '../../utils/cacheGetters/getFollowedRemoteIds'
import { getFollowerRemoteIds } from '../../utils/cacheGetters/getFollowerRemoteIds'
import { getPostAndUserFromPostId } from '../../utils/cacheGetters/getPostAndUserFromPostId'
import { logger } from '../../utils/logger'
import { checkuserAllowsThreads } from '../../utils/checkUserAllowsThreads'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Cacher = require('cacher')
const cacher = new Cacher()

// we get the user from the memory cache. if does not exist we try to find it
async function getLocalUserByUrl(url: string): Promise<any> {
  const userId = await getLocalUserId(url)
  return await User.findByPk(userId)
}

async function getLocalUserByUrlCache(url: string): Promise<any> {
  let cacheResult = await redisCache.get('localUserData:' + url)
  if (!cacheResult) {
    cacheResult = JSON.stringify((await getLocalUserByUrl(url))?.dataValues)
    if (cacheResult) {
      redisCache.set('localUserData:' + url, cacheResult, 'EX', 60)
    }
  }
  // this function can return undefined
  return cacheResult ? JSON.parse(cacheResult) : cacheResult
}

const inboxQueue = new Queue('inbox', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: 25000
  }
})

// all the stuff related to activitypub goes here

function activityPubRoutes(app: Application) {
  // get post
  app.get(
    ['/fediverse/post/:id', '/fediverse/activity/post/:id'],
    getCheckFediverseSignatureFucnction(false),
    async (req: SignedRequest, res: Response) => {
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
                (followerIds && !followerIds?.include(req.fediData.remoteUserUrl))
              ) {
                res.sendStatus(404)
                return
              }
            } catch (error) {
              logger.warn({
                message: 'Error on post',
                fediData: req.fediData,
                user: user.id,
                followerIds: followerIds
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
  )
  // Get blog for fediverse
  app.get(
    '/fediverse/blog/:url',
    getCheckFediverseSignatureFucnction(false),
    async (req: SignedRequest, res: Response) => {
      if (!req.params.url?.startsWith('@')) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrlCache(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user && !user.banned) {
          if(! (await checkuserAllowsThreads(req, user))){
              res.sendStatus(403);
              return;
          }
          const emojis = await getUserEmojis(user.id)
          const userForFediverse = {
            '@context': ['https://www.w3.org/ns/activitystreams', 'https://w3id.org/security/v1'],
            id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
            type: 'Person',
            following: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
            followers: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`,
            featured: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/featured`,
            inbox: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/inbox`,
            outbox: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/outbox`,
            preferredUsername: user.url.toLowerCase(),
            name: user.name,
            summary: user.description,
            url: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
            manuallyApprovesFollowers: user.manuallyAcceptsFollows,
            discoverable: true,
            published: user.createdAt,
            tag: emojis.map((emoji: any) => emojiToAPTag(emoji)),
            endpoints: {
              sharedInbox: `${environment.frontendUrl}/fediverse/sharedInbox`
            },
            ...(user.avatar
              ? {
                  icon: {
                    type: 'Image',
                    mediaType: 'image/webp',
                    url: environment.mediaUrl + user.avatar
                  }
                }
              : undefined),
            ...(user.headerImage
              ? {
                  image: {
                    type: 'Image',
                    mediaType: 'image/webp',
                    url: environment.mediaUrl + user.headerImage
                  }
                }
              : undefined),
            publicKey: {
              id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}#main-key`,
              owner: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
              publicKeyPem: user.publicKey
            }
          }

          res
            .set({
              'content-type': 'application/activity+json'
            })
            .send(userForFediverse)
        } else {
          return404(res)
        }
      } else {
        return404(res)
      }
      res.end()
    }
  )

  app.get('/fediverse/blog/:url/following', async (req: SignedRequest, res: Response) => {
    if (req.params?.url) {
      const url = req.params.url.toLowerCase()
      const user = await getLocalUserByUrlCache(url)
      if (user && user.banned) {
        res.sendStatus(410)
        return
      }
      if (user && !user.banned) {
        if(! (await checkuserAllowsThreads(req, user))){
          res.sendStatus(403);
          return;
      }
        const followedUsers = await getFollowedRemoteIds(user.id)
        const response = {
          '@context': 'https://www.w3.org/ns/activitystreams',
          id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
          type: 'OrderedCollection',
          totalItems: followedUsers.length,
          partOf: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
          orderedItems: followedUsers
        }
        res.set({
          'content-type': 'application/activity+json'
        })
        res.send(response)
      } else {
        return404(res)
      }
    } else {
      return404(res)
    }
    res.end()
  })

  app.get(
    '/fediverse/blog/:url/followers',
    // getCheckFediverseSignatureFucnction(true),
    async (req: SignedRequest, res: Response) => {
      if (req.params?.url) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrl(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user && !user.banned) {
          if(! (await checkuserAllowsThreads(req, user))){
            res.sendStatus(403);
            return;
        }
          const followers = await getFollowerRemoteIds(user.id)

          const followersNumber = followers.length
          let response: any = {
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`,
            type: 'OrderedCollectionPage',
            totalItems: followersNumber,
            orderedItems: followers,
            first: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers?page=1`
          }
          res.set({
            'content-type': 'application/activity+json'
          })
          res.send(response)
        } else {
          return404(res)
        }
      } else {
        return404(res)
      }
      res.end()
    }
  )

  app.get(
    '/fediverse/blog/:url/featured',
    //getCheckFediverseSignatureFucnction(true),
    async (req: SignedRequest, res: Response) => {
      if (req.params?.url) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrl(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user) {
          if(! (await checkuserAllowsThreads(req, user))){
            res.sendStatus(403);
            return;
        }
          res.set({
            'content-type': 'application/activity+json'
          })
          res.send({
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `${environment.frontendUrl}/fediverse/blog/${req.params.url}/featured`,
            type: 'OrderedCollection',
            totalItems: 0,
            orderedItems: []
          })
        } else {
          return404(res)
        }
      } else {
        return404(res)
      }
      res.end()
    }
  )

  // HERE is where the meat and potatoes are. This endpoint is what we use to recive stuff
  app.post(
    ['/fediverse/blog/:url/inbox', '/fediverse/sharedInbox'],
    getCheckFediverseSignatureFucnction(true),
    async (req: SignedRequest, res: Response) => {
      const urlToSearch = req.params?.url ? req.params.url : environment.adminUser
      const url = urlToSearch.toLowerCase()
      const user = await getLocalUserByUrl(url)
      if(user.url !== environment.adminUser && !(await checkuserAllowsThreads(req, user))){
        res.sendStatus(403);
        return;
    }
      if (user && user.banned) {
        res.sendStatus(410)
        return
      }
      if (user) {
        res.sendStatus(200)
        await inboxQueue.add('processInbox', { petition: req.body, petitionBy: user.id }, { jobId: req.body.id })
      } else {
        return404(res)
      }
      res.end()
    }
  )

  app.get(
    '/fediverse/blog/:url/outbox',
    getCheckFediverseSignatureFucnction(true),
    async (req: SignedRequest, res: Response) => {
      if (req.params?.url) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrlCache(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user) {
          res.sendStatus(200)
        } else {
          return404(res)
        }
      } else {
        return404(res)
      }
      res.end()
    }
  )

  app.get('/fediverse/emoji/:id', async (req: Request, res: Response) => {
    const id = req.params.id
    const emoji = await Emoji.findByPk(id)
    if (emoji) {
      res.set({
        'content-type': 'application/activity+json'
      })
      res.send({
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          {
            toot: 'http://joinmastodon.org/ns#',
            Emoji: 'toot:Emoji',
            focalPoint: { '@container': '@list', '@id': 'toot:focalPoint' }
          }
        ],
        id: environment.frontendUrl + '/fediverse/emoji/' + id,
        type: 'Emoji',
        name: emoji.name,
        updated: emoji.updatedAt,
        icon: {
          type: 'Image',
          mediaType: 'image/png',
          url: environment.mediaUrl + emoji.url
        }
      })
    } else {
      res.sendStatus(404)
    }
  })

  app.get('/fediverse/post/:id/replies', async (req: Request, res: Response) => {
    res.send({
      type: 'CollectionPage',
      partOf: `${environment.frontendUrl}/fediverse/post/${req.params?.id as string}/replies`,
      items: await getPostReplies(req.params?.id as string)
    })
  })

  app.get('/fediverse/accept/:id', (req: SignedRequest, res: Response) => {
    res.sendStatus(200)
  })
}

export { activityPubRoutes }

import { Application, Request, Response } from 'express'
import { User, Emoji, sequelize } from '../../models/index.js'
import { getCheckFediverseSignatureFunction } from '../../utils/activitypub/checkFediverseSignature.js'
import { return404 } from '../../utils/return404.js'
import { Queue } from 'bullmq'
import { SignedRequest } from '../../interfaces/fediverse/signedRequest.js'
import { getPostReplies } from '../../utils/activitypub/getPostReplies.js'
import { redisCache } from '../../utils/redis.js'
import { getFollowedRemoteIds } from '../../utils/cacheGetters/getFollowedRemoteIds.js'
import { getFollowerRemoteIds } from '../../utils/cacheGetters/getFollowerRemoteIds.js'
import { checkuserAllowsThreads } from '../../utils/checkUserAllowsThreads.js'
import { userToJSONLD } from '../../utils/activitypub/userToJSONLD.js'
import { completeEnvironment } from '../../utils/backendOptions.js'

// we get the user from the memory cache. if does not exist we try to find it
async function getLocalUserByUrl(url: string): Promise<any> {
  return await User.findOne({
    where: sequelize.where(sequelize.fn('lower', sequelize.col('url')), url.toLowerCase())
  })
}

async function getLocalUserByUrlCache(url: string): Promise<User | undefined> {
  let cacheResult = await redisCache.get('localUserData:' + url)
  if (!cacheResult) {
    cacheResult = JSON.stringify((await getLocalUserByUrl(url))?.dataValues)
    if (cacheResult) {
      redisCache.set('localUserData:' + url, cacheResult, 'EX', 300)
    }
  }
  // this function can return undefined
  return cacheResult ? JSON.parse(cacheResult) : undefined
}

const inboxQueue = new Queue('inbox', {
  connection: completeEnvironment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: true
  }
})

// all the stuff related to activitypub goes here

function activityPubRoutes(app: Application) {
  // Get blog for fediverse
  app.get(
    '/fediverse/blog/:url',
    getCheckFediverseSignatureFunction(false),
    async (req: SignedRequest, res: Response) => {
      const url = req.params.url.toLowerCase()
      if (req.headers['accept']?.includes('*')) {
        res.redirect(`/blog/${url}`)
        return
      }
      if (!req.params.url?.startsWith('@')) {
        const user = await getLocalUserByUrlCache(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user && !user.banned) {
          if (!(await checkuserAllowsThreads(req, user))) {
            res.sendStatus(403)
            return
          }
          const userForFediverse = await userToJSONLD(user)
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

  app.get(
    '/fediverse/blog/:url/following',
    getCheckFediverseSignatureFunction(false),
    async (req: SignedRequest, res: Response) => {
      if (req.params?.url) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrlCache(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user && !user.banned) {
          if (!(await checkuserAllowsThreads(req, user))) {
            res.sendStatus(403)
            return
          }
          const followedUsers = await getFollowedRemoteIds(user.id)
          let response: any
          if (req.query?.page) {
            const page = parseInt(req.query.page as string)
            const pageSize = 10
            const itemsToSend = followedUsers.slice((page - 1) * pageSize, page * pageSize)
            response = {
              '@context': 'https://www.w3.org/ns/activitystreams',
              id: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following?page=${page}`,
              type: 'OrderedCollectionPage',
              partOf: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
              orderedItems: itemsToSend
            }
            if (page > 1) {
              response['prev'] = `${
                completeEnvironment.frontendUrl
              }/fediverse/blog/${user.url.toLowerCase()}/following?page=${page - 1}`
            }
            if (followedUsers.length > pageSize * page) {
              response['next'] = `${
                completeEnvironment.frontendUrl
              }/fediverse/blog/${user.url.toLowerCase()}/following?page=${page + 1}`
            }
          } else {
            response = {
              '@context': 'https://www.w3.org/ns/activitystreams',
              id: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
              type: 'OrderedCollection',
              totalItems: followedUsers.length,
              partOf: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
              first: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following?page=1`
            }
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
    '/fediverse/blog/:url/followers',
    getCheckFediverseSignatureFunction(false),
    async (req: SignedRequest, res: Response) => {
      if (req.params?.url) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrlCache(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user && !user.banned) {
          if (!(await checkuserAllowsThreads(req, user))) {
            res.sendStatus(403)
            return
          }
          const followers = await getFollowerRemoteIds(user.id)
          const followersNumber = followers.length
          let response: any
          if (req.query?.page) {
            const page = parseInt(req.query.page as string)
            const pageSize = 10
            const itemsToSend = followers.slice((page - 1) * pageSize, page * pageSize)
            response = {
              '@context': 'https://www.w3.org/ns/activitystreams',
              id: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers?page=${
                req.query.page
              }`,
              type: 'OrderedCollectionPage',
              orderedItems: itemsToSend,
              totalItems: followersNumber
            }
            if (page > 1) {
              response['prev'] = `${
                completeEnvironment.frontendUrl
              }/fediverse/blog/${user.url.toLowerCase()}/followers?page=${page - 1}`
            }
            if (followers.length > pageSize * page) {
              response['next'] = `${
                completeEnvironment.frontendUrl
              }/fediverse/blog/${user.url.toLowerCase()}/followers?page=${page + 1}`
            }
          } else {
            response = {
              '@context': 'https://www.w3.org/ns/activitystreams',
              id: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`,
              type: 'OrderedCollection',
              totalItems: followersNumber,
              first: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers?page=1`
            }
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
    getCheckFediverseSignatureFunction(true),
    async (req: SignedRequest, res: Response) => {
      if (req.params?.url) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrlCache(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user) {
          if (!(await checkuserAllowsThreads(req, user))) {
            res.sendStatus(403)
            return
          }
          res.set({
            'content-type': 'application/activity+json'
          })
          res.send({
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `${completeEnvironment.frontendUrl}/fediverse/blog/${req.params.url}/featured`,
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
    getCheckFediverseSignatureFunction(true),
    async (req: SignedRequest, res: Response) => {
      const urlToSearch = req.params?.url ? req.params.url : completeEnvironment.adminUser
      const url = urlToSearch.toLowerCase()
      const user = await getLocalUserByUrlCache(url)
      if (user && user.url !== completeEnvironment.adminUser && !(await checkuserAllowsThreads(req, user))) {
        res.sendStatus(403)
        return
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
    getCheckFediverseSignatureFunction(false),
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
        id: completeEnvironment.frontendUrl + '/fediverse/emoji/' + id,
        type: 'Emoji',
        name: emoji.name,
        updated: emoji.updatedAt,
        icon: {
          type: 'Image',
          mediaType: 'image/png',
          url: completeEnvironment.mediaUrl + emoji.url
        }
      })
    } else {
      res.sendStatus(404)
    }
  })

  app.get('/fediverse/post/:id/replies', async (req: Request, res: Response) => {
    res.send({
      type: 'CollectionPage',
      partOf: `${completeEnvironment.frontendUrl}/fediverse/post/${req.params?.id as string}/replies`,
      items: await getPostReplies(req.params?.id as string)
    })
  })

  app.get('/fediverse/accept/:id', (req: SignedRequest, res: Response) => {
    res.sendStatus(200)
  })
}

export { activityPubRoutes }

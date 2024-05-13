import { Application, Request, Response } from 'express'
import { User, Follows, Post, Media, UserLikesPostRelations, Emoji } from '../../db'
import checkFediverseSignature from '../../utils/activitypub/checkFediverseSignature'
import { sequelize } from '../../db'
import { Op } from 'sequelize'
import { environment } from '../../environment'
import { return404 } from '../../utils/return404'
import { postToJSONLD } from '../../utils/activitypub/postToJSONLD'
import { Queue } from 'bullmq'
import { getLocalUserId } from '../../utils/cacheGetters/getLocalUserId'
import { SignedRequest } from '../../interfaces/fediverse/signedRequest'
import { emojiToAPTag } from '../../utils/activitypub/emojiToAPTag'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Cacher = require('cacher')
const cacher = new Cacher()

// we get the user from the memory cache. if does not exist we try to find it
async function getLocalUserByUrl(url: string): Promise<any> {
  const userId = await getLocalUserId(url)
  return await User.findByPk(userId)
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
    //checkFediverseSignature,
    async (req: SignedRequest, res: Response) => {
      if (req.params?.id) {
        const post = await Post.findOne({
          where: {
            id: req.params.id,
            privacy: {
              [Op.notIn]: [2, 10]
            }
          }
        })
        if (post) {
          const user = await User.findByPk(post.userId)
          if (user && user.banned) {
            res.sendStatus(410)
            return
          }
          // TODO corregir esto seguramente
          res.set({
            'content-type': 'application/activity+json'
          })
          const response = await postToJSONLD(post)
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
    //checkFediverseSignature,
    async (req: SignedRequest, res: Response) => {
      if (!req.params.url?.startsWith('@')) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrl(url)
        const emojis = await user.getEmojis()
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user && !user.banned) {
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

  app.get('/fediverse/blog/:url/following', checkFediverseSignature, async (req: SignedRequest, res: Response) => {
    if (req.params?.url) {
      const url = req.params.url.toLowerCase()
      const user = await getLocalUserByUrl(url)
      if (user && user.banned) {
        res.sendStatus(410)
        return
      }
      if (user) {
        const followedNumber = await User.count({
          where: {
            literal: sequelize.literal(`id in (SELECT followedId from follows where followerId like "${user.id}")`)
          }
        })
        let response: any = {
          '@context': 'https://www.w3.org/ns/activitystreams',
          id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
          type: 'OrderedCollectionPage',
          totalItems: followedNumber,
          first: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following?page=1`
        }
        if (req.query?.page && parseInt(req.query.page as string) > 0) {
          const pageNumber = parseInt(req.query.page as string)
          const maxPage = Math.floor(followedNumber / 10)
          const followed = await User.findAll({
            where: {
              literal: sequelize.literal(`id in (SELECT followedId from follows where followerId like "${user.id}")`)
            },
            order: [['createdAt', 'DESC']],
            limit: 10,
            offset: (pageNumber - 1) * 10
          })
          response = {
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
            type: 'OrderedCollection',
            totalItems: followedNumber,
            partOf: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following`,
            orderedItems: followed.map((elem: any) =>
              elem.remoteId ? elem.remoteId : `${environment.frontendUrl}/fediverse/blog/${elem.url}`
            )
          }

          if (pageNumber > 1) {
            response['prev'] = `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following?page=${
              pageNumber - 1
            }`
          }
          if (pageNumber < maxPage) {
            response['next'] = `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/following?page=${
              pageNumber + 1
            }`
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
  })

  app.get(
    '/fediverse/blog/:url/followers',
    // checkFediverseSignature,
    async (req: SignedRequest, res: Response) => {
      if (req.params?.url) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrl(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user) {
          const followersNumber = await User.count({
            where: {
              literal: sequelize.literal(`id in (SELECT followerId from follows where followedId like "${user.id}")`)
            }
          })
          let response: any = {
            '@context': 'https://www.w3.org/ns/activitystreams',
            id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`,
            type: 'OrderedCollectionPage',
            totalItems: followersNumber,
            first: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers?page=1`
          }
          if (req.query?.page && parseInt(req.query.page as string) > 0) {
            const pageNumber = parseInt(req.query.page as string)
            const maxPage = Math.floor(followersNumber / 10)
            const followers = await User.findAll({
              where: {
                literal: sequelize.literal(`id in (SELECT followerId from follows where followedId like "${user.id}")`)
              },
              order: [['createdAt', 'DESC']],
              limit: 10,
              offset: (pageNumber - 1) * 10
            })
            response = {
              '@context': 'https://www.w3.org/ns/activitystreams',
              id: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`,
              type: 'OrderedCollection',
              totalItems: followersNumber,
              partOf: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`,
              orderedItems: followers.map((elem: any) =>
                elem.remoteId ? elem.remoteId : `${environment.frontendUrl}/fediverse/blog/${elem.url}`
              )
            }

            if (pageNumber > 1) {
              response['prev'] = `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers?page=${
                pageNumber - 1
              }`
            }
            if (pageNumber < maxPage) {
              response['next'] = `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers?page=${
                pageNumber + 1
              }`
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
    //checkFediverseSignature,
    async (req: SignedRequest, res: Response) => {
      if (req.params?.url) {
        const url = req.params.url.toLowerCase()
        const user = await getLocalUserByUrl(url)
        if (user && user.banned) {
          res.sendStatus(410)
          return
        }
        if (user) {
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
    checkFediverseSignature,
    async (req: SignedRequest, res: Response) => {
      const urlToSearch = req.params?.url ? req.params.url : environment.adminUser
      const url = urlToSearch.toLowerCase()
      const user = await getLocalUserByUrl(url)
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

  app.get('/fediverse/blog/:url/outbox', checkFediverseSignature, async (req: SignedRequest, res: Response) => {
    if (req.params?.url) {
      const url = req.params.url.toLowerCase()
      const user = await getLocalUserByUrl(url)
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
  })

  app.get('/fediverse/emoji/:id', async (req: Request, res: Response) => {
    const id = req.params.id;
    const emoji = await Emoji.findByPk(id)
    if(emoji) {
      res.set({
        'content-type': 'application/activity+json'
      })
      res.send({
        "@context":["https://www.w3.org/ns/activitystreams",
        {
          toot: "http://joinmastodon.org/ns#","Emoji":"toot:Emoji","focalPoint":{"@container":"@list","@id":"toot:focalPoint"}}],
        id : environment.frontendUrl + '/fediverse/emoji/' + id,
        type : "Emoji",
        name : emoji.name,
        updated : emoji.updatedAt,
        icon : {
          type : "Image",
          mediaType :"image/png",
          url : environment.mediaUrl + emoji.url
        }
      })
    } else {
      res.sendStatus(404)
    }
  })

  app.get('/fediverse/accept/:id', (req: SignedRequest, res: Response) => {
    res.sendStatus(200)
  })
}

export { activityPubRoutes }

import { Application, Response } from 'express'
import {
  FederatedHost,
  Media,
  Notification,
  Post,
  PostHostView,
  PostMentionsUserRelation,
  PostTag,
  RemoteUserPostView,
  User,
  UserLikesPostRelations
} from '../models/index.js'
import { authenticateToken } from '../utils/authenticateToken.js'
import { Model, Op, Sequelize } from 'sequelize'
import { logger } from '../utils/logger.js'
import { Queue } from 'bullmq'
import { environment } from '../environment.js'
import { activityPubObject } from '../interfaces/fediverse/activityPubObject.js'
import _ from 'underscore'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { LdSignature } from '../utils/activitypub/rsa2017.js'
import { deletePostCommon } from '../utils/deletePost.js'
import { redisCache } from '../utils/redis.js'
import { getAtProtoSession } from '../atproto/utils/getAtProtoSession.js'
import { Privacy } from '../models/post.js'

const deletePostQueue = new Queue('deletePostQueue', {
  connection: environment.bullmqConnection,
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

export default function deletePost(app: Application) {
  app.delete('/api/deletePost', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const id = req.query.id as string
      const posterId = req.jwtData?.userId
      const user = await User.findByPk(posterId)
      if (id && user) {
        let postToDelete = await Post.findOne({
          where: {
            id,
            userId: posterId
          }
        })
        if (!postToDelete) {
          if (user.role === 10) {
            postToDelete = await Post.findOne({
              where: {
                id: id
              }
            })
          }
          if (!postToDelete) {
            res.sendStatus(500)
            return
          }
        }
        // bsky delete
        if (postToDelete.bskyUri && user.enableBsky) {
          const agent = await getAtProtoSession(user)
          if (postToDelete.bskyCid) {
            await agent.deletePost(postToDelete.bskyUri)
          } else {
            await agent.deleteRepost(postToDelete.bskyUri)
          }
        }
        // bsky delete end
        const objectToSend: activityPubObject = {
          '@context': [`${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
          actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
          to: ['https://www.w3.org/ns/activitystreams#Public'],
          id: `${environment.frontendUrl}/fediverse/post/${postToDelete.id}#delete`,
          object: {
            atomUri: `${environment.frontendUrl}/fediverse/post/${postToDelete.id}`,
            id: `${environment.frontendUrl}/fediverse/post/${postToDelete.id}`,
            type: 'Tombstone'
          },
          type: 'Delete'
        }

        let serversToSendThePost
        let usersToSendThePost
        // if the post is previous to the new functionality of storing who has seen the post, send to everyone
        // or NUKE has been requested
        if (new Date(postToDelete.createdAt).getTime() < 1721437200091 || req.query?.nuke) {
          serversToSendThePost = await FederatedHost.findAll({
            where: {
              publicInbox: { [Op.ne]: null },
              blocked: false
            }
          })
          const usersToSendThePostHost = await FederatedHost.findAll({
            where: {
              publicInbox: { [Op.eq]: null },
              blocked: false
            },
            include: [
              {
                model: User,
                attributes: ['remoteInbox'],
                where: {
                  remoteInbox: { [Op.ne]: null },
                  banned: false
                }
              }
            ]
          })
          usersToSendThePost = usersToSendThePostHost.flatMap((elem: any) => elem.users)
        } else {
          const serverViews = await PostHostView.findAll({
            where: {
              postId: postToDelete.id
            }
          })
          const userViews = await RemoteUserPostView.findAll({
            where: {
              postId: postToDelete.id
            }
          })

          serversToSendThePost = FederatedHost.findAll({
            where: {
              id: {
                [Op.in]: serverViews.map((view: any) => view.federatedHostId)
              }
            }
          })
          usersToSendThePost = User.findAll({
            where: {
              id: {
                [Op.in]: userViews.map((view: any) => view.userId)
              }
            }
          })
        }

        await Promise.all([serversToSendThePost, usersToSendThePost])
        serversToSendThePost = await serversToSendThePost
        usersToSendThePost = await usersToSendThePost
        let inboxes: string[] = []
        inboxes = inboxes
          .concat(serversToSendThePost.map((elem: any) => elem.publicInbox))
          .concat(usersToSendThePost.map((usr: any) => usr.remoteInbox))
        const ldSignature = new LdSignature()
        if (user.privateKey) {
          const bodySignature = await ldSignature.signRsaSignature2017(
            objectToSend,
            user.privateKey,
            `${environment.frontendUrl}/fediverse/blog/${user.url.toLocaleLowerCase()}`,
            environment.instanceUrl,
            new Date()
          )
          if (postToDelete.privacy != Privacy.LocalOnly) {
            for await (const inboxChunk of _.chunk(inboxes, 1)) {
              await deletePostQueue.add('sendChunk', {
                objectToSend: { ...objectToSend, signature: bodySignature.signature },
                petitionBy: user,
                inboxList: inboxChunk
              })
            }
          }
        }
        await redisCache.del('postAndUser:' + id)
        await deletePostCommon(id)
        success = true
      }
    } catch (error) {
      logger.error(error)
      success = false
    }

    res.send({ success })
  })

  app.delete('/api/deleteRewoots', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const id = req.query.id as string
      const posterId = req.jwtData?.userId
      const user = await User.findByPk(posterId)
      if (id && user) {
        let postsToDeleteUnfiltered = await Post.findAll({
          where: {
            parentId: id,
            content: '',
            isReblog: true,
            userId: posterId
          }
        })
        const unfilteredPostIds: string[] = postsToDeleteUnfiltered.map((elem: any) => elem.id)

        const reblogsToDelete = unfilteredPostIds

        if (!reblogsToDelete) {
          return res.send({ success: true })
        }
        if (user.enableBsky) {
          const agent = await getAtProtoSession(user)
          postsToDeleteUnfiltered
            .filter((elem) => elem.bskyUri && !elem.bskyCid)
            .forEach((elem) => {
              agent.deleteRepost(elem.bskyUri as string)
            })
        }

        const objectsToSend: activityPubObject[] = reblogsToDelete.map((elem) => {
          return {
            '@context': [`${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
            actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
            to: ['https://www.w3.org/ns/activitystreams#Public'],
            id: `${environment.frontendUrl}/fediverse/post/${elem}#delete`,
            object: {
              atomUri: `${environment.frontendUrl}/fediverse/post/${elem}`,
              id: `${environment.frontendUrl}/fediverse/post/${elem}`,
              type: 'Tombstone'
            },
            type: 'Delete'
          }
        })

        let serversToSendThePost
        let usersToSendThePost
        // if the post is previous to the new functionality of storing who has seen the post, send to everyone
        // or NUKE has been requested
        const serverViews = await PostHostView.findAll({
          where: {
            postId: {
              [Op.in]: reblogsToDelete
            }
          }
        })
        const userViews = await RemoteUserPostView.findAll({
          where: {
            postId: {
              [Op.in]: reblogsToDelete
            }
          }
        })

        serversToSendThePost = FederatedHost.findAll({
          where: {
            id: {
              [Op.in]: serverViews.map((view: any) => view.federatedHostId)
            }
          }
        })
        usersToSendThePost = User.findAll({
          where: {
            id: {
              [Op.in]: userViews.map((view: any) => view.userId)
            }
          }
        })

        await Promise.all([serversToSendThePost, usersToSendThePost])
        serversToSendThePost = await serversToSendThePost
        usersToSendThePost = await usersToSendThePost
        let inboxes: string[] = []
        inboxes = inboxes
          .concat(serversToSendThePost.map((elem: any) => elem.publicInbox))
          .concat(usersToSendThePost.map((usr: any) => usr.remoteInbox))

        if (user.privateKey)
          for await (const objectToSend of objectsToSend) {
            const ldSignature = new LdSignature()
            const bodySignature = await ldSignature.signRsaSignature2017(
              objectToSend,
              user.privateKey,
              `${environment.frontendUrl}/fediverse/blog/${user.url.toLocaleLowerCase()}`,
              environment.instanceUrl,
              new Date()
            )
            for await (const inboxChunk of inboxes) {
              await deletePostQueue.add('sendChunk', {
                objectToSend: { ...objectToSend, signature: bodySignature.signature },
                petitionBy: user,
                inboxList: inboxChunk
              })
            }
          }
        reblogsToDelete.forEach(async (elem) => {
          await redisCache.del('postAndUser:' + elem)
        })
        await Notification.destroy({
          where: {
            notificationType: 'REWOOT',
            postId: req.query.id as string,
            userId: user.id
          }
        })
        await Post.destroy({
          where: {
            id: {
              [Op.in]: reblogsToDelete
            }
          }
        })
        success = true
      }
    } catch (error) {
      logger.error({
        message: `Error deleting rewoots`,
        error: error
      })
      success = false
    }

    res.send({ success })
  })
}

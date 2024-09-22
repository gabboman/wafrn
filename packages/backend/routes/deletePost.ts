import { Application, Response } from 'express'
import {
  FederatedHost,
  Media,
  Post,
  PostHostView,
  PostMentionsUserRelation,
  PostTag,
  RemoteUserPostView,
  User,
  UserLikesPostRelations
} from '../db'
import { authenticateToken } from '../utils/authenticateToken'
import { Op, Sequelize } from 'sequelize'
import { logger } from '../utils/logger'
import { Queue } from 'bullmq'
import { environment } from '../environment'
import { activityPubObject } from '../interfaces/fediverse/activityPubObject'
import _ from 'underscore'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { LdSignature } from '../utils/activitypub/rsa2017'
import { deletePostCommon } from '../utils/deletePost'
import { redisCache } from '../utils/redis'

const deletePostQueue = new Queue('deletePostQueue', {
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

export default function deletePost(app: Application) {
  app.delete('/api/deletePost', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const id = req.query.id as string
      const posterId = req.jwtData?.userId
      const user = await User.findByPk(posterId)
      if (id) {
        const postToDelete = await Post.findOne({
          where: {
            id,
            userId: posterId
          }
        })
        if (!postToDelete) {
          res.sendStatus(500)
          return
        }
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
          serversToSendThePost = FederatedHost.findAll({
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
        const bodySignature = await ldSignature.signRsaSignature2017(
          objectToSend,
          user.privateKey,
          `${environment.frontendUrl}/fediverse/blog/${user.url.toLocaleLowerCase()}`,
          environment.instanceUrl,
          new Date()
        )
        if (postToDelete.privacy != 2) {
          for await (const inboxChunk of _.chunk(inboxes, 1)) {
            await deletePostQueue.add('sencChunk', {
              objectToSend: { ...objectToSend, signature: bodySignature.signature },
              petitionBy: user,
              inboxList: inboxChunk
            })
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

    res.send(success)
  })

  app.delete('/api/deleteRewoots', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const id = req.query.id as string
      const posterId = req.jwtData?.userId
      const user = await User.findByPk(posterId)
      if (id) {
        let postsToDeleteUnfiltered = await Post.findAll({
          where: {
            parentId: id,
            content: '',
            userId: posterId
          }
        })
        const unfilteredPostIds: string[] = postsToDeleteUnfiltered.map((elem: any) => elem.id)
        const tags = await PostTag.findAll({
          where: {
            postId: {
              [Op.in]: unfilteredPostIds
            }
          }
        })
        const medias = await Media.findAll({
          where: {
            postId: {
              [Op.in]: unfilteredPostIds
            }
          }
        })

        const postsThatAreNotReblogs = tags
          .map((tag: any) => tag.postId)
          .concat(medias.map((media: any) => media.postId))
        const reblogsToDelete = unfilteredPostIds.filter((elem) => !postsThatAreNotReblogs.includes(elem))

        if (!reblogsToDelete) {
          return res.send(true)
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
            await deletePostQueue.add('sencChunk', {
              objectToSend: { ...objectToSend, signature: bodySignature.signature },
              petitionBy: user,
              inboxList: inboxChunk
            })
          }
        }
        reblogsToDelete.forEach(async (elem) => {
          await redisCache.del('postAndUser:' + elem)
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
      logger.error(error)
      success = false
    }

    res.send(success)
  })
}

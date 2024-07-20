import { Application, Response } from 'express'
import { FederatedHost, Post, PostHostView, PostMentionsUserRelation, PostTag, RemoteUserPostView, User, UserLikesPostRelations } from '../db'
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

        let serversToSendThePost;
        let usersToSendThePost;
        // if the post is previous to the new functionality of storing who has seen the post, send to everyone
        // or NUKE has been requested
        if ((new Date(postToDelete.createdAt)).getTime() < 1721437200091 || req.query?.nuke) {
          serversToSendThePost = FederatedHost.findAll({
            where: {
              publicInbox: { [Op.ne]: null },
              blocked: false
            }
          })
          usersToSendThePost = FederatedHost.findAll({
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
        inboxes = inboxes.concat(serversToSendThePost.map((elem: any) => elem.publicInbox))
        usersToSendThePost?.forEach((server: any) => {
          inboxes = inboxes.concat(server.users.map((elem: any) => elem.remoteInbox))
        })
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
}

import { Application, Response } from 'express'
import { FederatedHost, Post, PostMentionsUserRelation, PostTag, User, UserLikesPostRelations } from '../db'
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

const sendPostQueue = new Queue('sendPostToInboxes', {
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

        let serversToSendThePost = FederatedHost.findAll({
          where: {
            publicInbox: { [Op.ne]: null },
            blocked: false
          }
        })
        let usersToSendThePost = FederatedHost.findAll({
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
          for await (const inboxChunk of _.chunk(inboxes, 50)) {
            await sendPostQueue.add(
              'sencChunk',
              {
                objectToSend: { ...objectToSend, signature: bodySignature.signature },
                petitionBy: user.dataValues,
                inboxList: inboxChunk
              },
              {
                priority: 50
              }
            )
          }
        }

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

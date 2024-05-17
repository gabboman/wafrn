import { Op, Sequelize } from 'sequelize'
import { logger } from '../logger'
import { postPetitionSigned } from '../activitypub/postPetitionSigned'
import { postToJSONLD } from '../activitypub/postToJSONLD'
import { LdSignature } from '../activitypub/rsa2017'
import { FederatedHost, Post, User, sequelize } from '../../db'
import { environment } from '../../environment'
import { Job, Queue } from 'bullmq'
import _ from 'underscore'
import { wait } from '../wait'

const sendPostQueue = new Queue('sendPostToInboxes', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 25000
    },
    removeOnFail: 25000
  }
})
async function prepareSendRemotePostWorker(job: Job) {
  // TODO fix this! this is dirtier than my unwashed gim clothes
  await wait(1500)
  //async function sendRemotePost(localUser: any, post: any) {
  const post = await Post.findOne({
    where: {
      id: job.id
    }
  })
  const localUser = await User.findOne({
    where: {
      id: post.userId
    }
  })

  // servers with shared inbox
  let serversToSendThePost
  const localUserFollowers = await localUser.getFollower()
  const followersServers = localUserFollowers.map((el: any) => el.federatedHostId)
  // for servers with no shared inbox
  let usersToSendThePost = await FederatedHost.findAll({
    where: {
      publicInbox: { [Op.eq]: null },
      blocked: false
    },
    include: [
      {
        required: true,
        model: User,
        attributes: ['remoteInbox'],
        where: {
          banned: false,
          id: {
            [Op.in]: (await localUser.getFollower()).map((usr: any) => usr.id)
          }
        }
      }
    ]
  })
  // mentioned users
  const mentionedUsers = await post.getMentionPost({
    attributes: ['remoteInbox'],
    where: {
      federatedHostId: { [Op.ne]: null }
    }
  })
  switch (post.privacy) {
    case 2: {
      break
    }
    case 10: {
      serversToSendThePost = []
      usersToSendThePost = []
      break
    }
    default: {
      serversToSendThePost = await FederatedHost.findAll({
        where: {
          publicInbox: { [Op.ne]: null },
          blocked: { [Op.ne]: true },
          [Op.or]: [
            {
              id: {
                [Op.in]: followersServers
              }
            },
            {
              friendServer: true
            }
          ]
        }
      })
    }
  }
  const objectToSend = await postToJSONLD(post)
  const ldSignature = new LdSignature()
  const bodySignature = await ldSignature.signRsaSignature2017(
    objectToSend,
    localUser.privateKey,
    `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLocaleLowerCase()}`,
    environment.instanceUrl,
    new Date(post.createdAt)
  )

  const objectToSendComplete = { ...objectToSend, signature: bodySignature.signature }
  if (mentionedUsers?.length > 0) {
    const mentionedInboxes = mentionedUsers.map((elem: any) => elem.remoteInbox)
    for await (const remoteInbox of mentionedInboxes) {
      try {
        const response = await postPetitionSigned(objectToSendComplete, localUser, remoteInbox)
      } catch (error) {
        logger.debug(error)
      }
    }
  }

  if (serversToSendThePost?.length > 0 || usersToSendThePost?.length > 0) {
    let inboxes: string[] = []
    inboxes = inboxes.concat(serversToSendThePost.map((elem: any) => elem.publicInbox))
    usersToSendThePost?.forEach((server: any) => {
      inboxes = inboxes.concat(server.users.map((elem: any) => elem.remoteInbox))
    })
    const addSendPostToQueuePromises: Promise<any>[] = []
    logger.debug(`Preparing send post. ${inboxes.length} inboxes`)
    for (const inboxChunk of _.chunk(inboxes, 10)) {
      addSendPostToQueuePromises.push(
        sendPostQueue.add(
          'sencChunk',
          {
            objectToSend: objectToSendComplete,
            petitionBy: localUser.dataValues,
            inboxList: inboxChunk
          },
          {
            priority: 1
          }
        )
      )
    }
    await Promise.allSettled(addSendPostToQueuePromises)
  }
}

export { prepareSendRemotePostWorker }

import { Op } from 'sequelize'
import { FederatedHost, PostHostView, RemoteUserPostView, User } from '../../models/index.js'
import { environment } from '../../environment.js'
import { postToJSONLD } from './postToJSONLD.js'
import { LdSignature } from './rsa2017.js'
import _ from 'underscore'
import { Queue } from 'bullmq'
import { redisCache } from '../redis.js'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'

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
async function federatePostHasBeenEdited(postToEdit: any) {
  const user = await User.findByPk(postToEdit.userId)
  if (!user) return

  await redisCache.del('postAndUser:' + postToEdit.id)
  const postAsJSONLD = await postToJSONLD(postToEdit.id)
  if (!postAsJSONLD) {
    return
  }
  const objectToSend = {
    '@context': [`${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
    actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
    to: postAsJSONLD.to,
    cc: postAsJSONLD.cc,
    bto: [],
    published: new Date(postToEdit.updatedAt).toISOString(),
    id: `${environment.frontendUrl}/fediverse/post/${postToEdit.id}/update/${new Date(postToEdit.updatedAt).getTime()}`,
    object: postAsJSONLD.object,
    type: 'Update'
  }

  let serversToSendThePostIds = (
    await PostHostView.findAll({
      where: {
        postId: postToEdit.id
      }
    })
  ).map((elem) => elem.federatedHostId)
  let serversToSendThePostPromise = FederatedHost.findAll({
    where: {
      id: {
        [Op.in]: serversToSendThePostIds
      }
    }
  })
  let usersToSendPostId = (
    await RemoteUserPostView.findAll({
      where: {
        postId: postToEdit.id
      }
    })
  ).map((elem) => elem.userId)
  let usersToSendThePostPromise = User.findAll({
    where: {
      id: {
        [Op.in]: usersToSendPostId
      }
    }
  })

  await Promise.all([serversToSendThePostPromise, usersToSendThePostPromise])
  let serversToSendThePost = await serversToSendThePostPromise
  let usersToSendThePost = await usersToSendThePostPromise
  let urlsToSendPost: string[] = []

  if (serversToSendThePost) {
    urlsToSendPost = urlsToSendPost.concat(serversToSendThePost.map((server: any) => server.publicInbox))
  }
  if (usersToSendThePost) {
    urlsToSendPost = urlsToSendPost.concat(usersToSendThePost.map((usr: any) => usr.remoteInbox))
  }
  if (!user.privateKey) return

  const ldSignature = new LdSignature()
  const bodySignature = await ldSignature.signRsaSignature2017(
    objectToSend,
    user.privateKey,
    `${environment.frontendUrl}/fediverse/blog/${user.url.toLocaleLowerCase()}`,
    environment.instanceUrl,
    new Date()
  )
  for await (const inboxChunk of urlsToSendPost) {
    await sendPostQueue.add(
      'editPostChunk',
      {
        objectToSend: {
          ...objectToSend,
          signature: bodySignature.signature
        },
        petitionBy: user.dataValues,
        inboxList: inboxChunk
      },
      {
        priority: 500,
        delay: 2500
      }
    )
  }
}

export { federatePostHasBeenEdited }

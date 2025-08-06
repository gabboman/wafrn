import { Application, Response } from 'express'
import { adminToken, authenticateToken } from '../utils/authenticateToken.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { Queue } from 'bullmq'
import { FederatedHost } from '../models/index.js'
import { completeEnvironment } from '../utils/backendOptions.js'

export default function statusRoutes(app: Application) {
  app.get('/api/status/workerStats', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    const sendPostsQueue = new Queue('sendPostToInboxes', {
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
    const prepareSendPostQueue = new Queue('prepareSendPost', {
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

    const deletePostQueue = new Queue('deletePostQueue', {
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
    const firehoseQueue = new Queue('firehoseQueue', {
      connection: completeEnvironment.bullmqConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        attempts: 6,
        backoff: {
          type: 'exponential',
          delay: 25000
        },
        removeOnFail: false
      }
    })

    const sendPostBskyQueue = new Queue('sendPostBsky', {
      connection: completeEnvironment.bullmqConnection
    })
    const workerGenerateUserKeyPair = new Queue('generateUserKeyPair', {
      connection: completeEnvironment.bullmqConnection
    })
    const wsWaitingQueue = new Queue('updateNotificationsSocket', {
      connection: completeEnvironment.bullmqConnection
    })
    const createKeyPairWaiting = workerGenerateUserKeyPair.count()
    const atProtoAwaiting = firehoseQueue.count()
    const sendPostFailed = sendPostsQueue.getMetrics('failed')
    const sendPostSuccess = sendPostsQueue.getMetrics('completed')
    const sendPostAwaiting = sendPostsQueue.count()
    const prepareSendPostFail = prepareSendPostQueue.getMetrics('failed')
    const prepareSendPostSuccess = prepareSendPostQueue.getMetrics('completed')
    const prepareSendPostAwaiting = prepareSendPostQueue.count()
    const inboxFail = inboxQueue.getMetrics('failed')
    const inboxSuccess = inboxQueue.getMetrics('completed')
    const inboxAwaiting = inboxQueue.count()
    const deletePostAwaiting = deletePostQueue.count()
    const sendPostBskyAwaiting = sendPostBskyQueue.count()
    const notificationsWSPending = wsWaitingQueue.count()

    await Promise.allSettled([
      sendPostFailed,
      sendPostSuccess,
      prepareSendPostFail,
      prepareSendPostSuccess,
      inboxFail,
      inboxSuccess,
      sendPostAwaiting,
      prepareSendPostAwaiting,
      inboxAwaiting,
      atProtoAwaiting,
      createKeyPairWaiting,
      sendPostBskyAwaiting,
      notificationsWSPending
    ])

    res.send({
      createKeyPairWaiting: await createKeyPairWaiting,
      sendPostAwaiting: await sendPostAwaiting,
      prepareSendPostAwaiting: await prepareSendPostAwaiting,
      inboxAwaiting: await inboxAwaiting,
      deletePostAwaiting: await deletePostAwaiting,
      atProtoAwaiting: await atProtoAwaiting,
      sendPostBskyAwaiting: await sendPostBskyAwaiting,
      socketPending: await notificationsWSPending
    })
  })

  app.get('/api/status/blocks', async (req: AuthorizedRequest, res: Response) => {
    res.send(
      await FederatedHost.findAll({
        attributes: ['displayName'],
        where: {
          blocked: true
        }
      })
    )
  })
}

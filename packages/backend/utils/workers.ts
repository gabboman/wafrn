import { Job, MetricsTime, Worker } from 'bullmq'
import { environment } from '../environment.js'
import { inboxWorker } from './queueProcessors/inbox.js'
import { prepareSendRemotePostWorker } from './queueProcessors/prepareSendRemotePost.js'
import { sendPostToInboxes } from './queueProcessors/sendPostToInboxes.js'
import { getRemoteActorIdProcessor } from './queueProcessors/getRemoteActorIdProcessor.js'
import { logger } from './logger.js'
import { processRemotePostView } from './queueProcessors/processRemotePostView.js'
import { processRemoteMedia } from './queueProcessors/remoteMediaProcessor.js'
import {processFirehose} from "../atproto/workers/processFirehoseWorker.js";

logger.info('starting workers')
const workerInbox = new Worker('inbox', (job: Job) => inboxWorker(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.low
})

const workerPrepareSendPost = new Worker('prepareSendPost', (job: Job) => prepareSendRemotePostWorker(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.high,
  lockDuration: 60000
})

const workerSendPostChunk = new Worker('sendPostToInboxes', (job: Job) => sendPostToInboxes(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.high,
  lockDuration: 120000
})

const workerDeletePost = new Worker('deletePostQueue', (job: Job) => sendPostToInboxes(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.high,
  lockDuration: 120000
})

const workerGetUser = new Worker('getRemoteActorId', async (job: Job) => await getRemoteActorIdProcessor(job), {
  connection: environment.bullmqConnection,
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK * 2
  },
  concurrency: environment.workers.high,
  lockDuration: 120000
})

const workerProcessRemotePostView = new Worker(
  'processRemoteView',
  async (job: Job) => await processRemotePostView(job),
  {
    connection: environment.bullmqConnection,
    metrics: {
      maxDataPoints: MetricsTime.ONE_WEEK * 2
    },
    concurrency: environment.workers.low,
    lockDuration: 120000
  }
)

const workerProcessRemoteMediaData = new Worker(
  'processRemoteMediaData',
  async (job: Job) => await processRemoteMedia(job),
  {
    connection: environment.bullmqConnection,
    metrics: {
      maxDataPoints: MetricsTime.ONE_WEEK * 2
    },
    concurrency: environment.workers.low,
    lockDuration: 120000
  }
)

const workerProcessFirehose = environment.enableBsky ? new Worker(
  'firehoseQueue', async (job: Job) => await processFirehose(job),
  {
    connection: environment.bullmqConnection,
    metrics: {
      maxDataPoints: MetricsTime.ONE_WEEK * 2
    },
    concurrency: environment.workers.medium,
    lockDuration: 120000
  }
) : null

const workers = [
  workerInbox,
  workerDeletePost,
  workerGetUser,
  workerPrepareSendPost,
  workerProcessRemotePostView,
  workerSendPostChunk,
  workerProcessRemotePostView,
  workerProcessRemoteMediaData,
]
if(environment.enableBsky) {
  workers.push(workerProcessFirehose as Worker)
}

workers.forEach((worker) => {
  worker.on('error', (err) => {
    logger.warn({
      message: `worker ${worker.name} failed`,
      error: err
    })
  })
})

export { workerInbox, workerSendPostChunk, workerPrepareSendPost, workerGetUser, workerDeletePost, workerProcessRemotePostView, workerProcessRemoteMediaData, workerProcessFirehose }

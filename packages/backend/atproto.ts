import { Firehose } from '@skyware/firehose'
import { getCacheAtDids } from './atproto/cache/getCacheAtDids.js'
import { Job, Queue, Worker } from 'bullmq'
import { checkCommitMentions } from './atproto/utils/checkCommitMentions.js'
import { logger } from './utils/logger.js'
import { completeEnvironment } from './utils/backendOptions.js'

//const firehose = new Firehose(`wss://bolson.bsky.dev`);

let cachedDids = await getCacheAtDids(true)
const firehose = new Firehose()

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

firehose.on('commit', async (commit) => {
  const cacheData = cachedDids

  if (cacheData.followedDids.has(commit.repo) || checkCommitMentions(commit, cacheData))
    for await (const op of commit.ops) {
      const data = {
        repo: commit.repo,
        operation: op
      }
      await firehoseQueue.add('processFirehoseQueue', data)
    }
})
firehose.start()

const workerForceUpdateAtDidCache = new Worker(
  'forceUpdateDids',
  async (job: Job) => {
    logger.info(`Atproto force update of dids`)
    cachedDids = await getCacheAtDids(true)
  },
  {
    connection: completeEnvironment.bullmqConnection,
    concurrency: 1,
    lockDuration: 120000
  }
)

workerForceUpdateAtDidCache.on('failed', (err) => {
  logger.warn({
    message: `workerforceUpdateDids failed`,
    error: err
  })
})

logger.info('started atproto')

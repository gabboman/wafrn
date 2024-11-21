import { Firehose } from "@skyware/firehose";
import { getCacheAtDids } from "./atproto/cache/getCacheAtDids.js";
import { Queue } from "bullmq";
import { environment } from "./environment.js";
import { checkCommitMentions } from "./atproto/utils/checkCommitMentions.js";
import { logger } from "./utils/logger.js";

const firehose = new Firehose(`wss://bolson.bsky.dev`);

const firehoseQueue = new Queue('firehoseQueue', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 6,
    backoff: {
      type: 'exponential',
      delay: 25000
    },
    removeOnFail: 25000
  }
})

firehose.on("commit", async (commit) => {
  const cacheData = await getCacheAtDids()
  if (cacheData.followedDids.includes(commit.repo) || await checkCommitMentions(commit, cacheData.localUserDids))
    for await (const op of commit.ops) {
      const data = {
        repo: commit.repo,
        operation: op
      }
      await firehoseQueue.add('processFirehoseQueue', data)
    }
});

firehose.on("error", (error) => {
  logger.warn({
    message: `Error on firehose`,
    error: error
  })
})
firehose.start();

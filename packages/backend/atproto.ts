import { Firehose } from "@skyware/firehose";
import {getCacheAtDids} from "./atproto/cache/getCacheAtDids.js";
import {Queue} from "bullmq";
import {environment} from "./environment.js";

const firehose = new Firehose();

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
  if((await getCacheAtDids()).includes(commit.repo))
  for await (const op of commit.ops) {
    const data = {
      repo: commit.repo,
      operation: op
    }
    await firehoseQueue.add('processFirehoseQueue', data)
  }
});
firehose.start();

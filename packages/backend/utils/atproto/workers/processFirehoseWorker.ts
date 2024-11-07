import {Job} from "bullmq";
import {getAtprotoUser} from "../getAtprotoUser.js";
import {User, UserLikesPostRelations} from "../../../db.js";
import {environment} from "../../../environment.js";
import {Model} from "sequelize";
import {logger} from "../../logger.js";
import {RepoOp} from "@skyware/firehose";
import {getAtProtoThread} from "../getAtProtoThread.js";

const adminUser = User.findOne({
  where: {
    url: environment.adminUser
  }
})
async function processFirehose(job: Job) {
  // FIRST VERSION. THIS IS GONA BE DIRTY
  const remoteUser = await getAtprotoUser(job.data.repo, await adminUser as Model<any, any>);
  const operation: RepoOp = job.data.operation;
  if(remoteUser && operation) {
    switch (operation.action) {
      case 'create': {
        const record = operation.record;
        switch(record['$type']) {
          case 'app.bsky.feed.like': {
            const postLikedUri = record.subject.uri;
            const postId = await getAtProtoThread(postLikedUri);
            if(postId) {
              await UserLikesPostRelations.findOrCreate({
                userId: remoteUser.id,
                postId: postId,
                //bskyUri:
              })
            }

            break;
          }
          default: {
            logger.warn({message: `Bsky create type not implemented: ${record['$type']}`, record: record})

          }

        }
        break;
      }
      default: {
        logger.warn({message: `Bsky action not implemented: ${operation.action}`, operation: operation})
      }
    }

  } else {
    logger.debug(`Failed to find remote bsky`)
  }

}

export {processFirehose}

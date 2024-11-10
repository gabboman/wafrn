import {Job} from "bullmq";
import {getAtprotoUser} from "../utils/getAtprotoUser.js";
import {Follows, Post, User, UserLikesPostRelations} from "../../db.js";
import {environment} from "../../environment.js";
import {Model} from "sequelize";
import {logger} from "../../utils/logger.js";
import {DeleteOp, RepoOp} from "@skyware/firehose";
import {getAtProtoThread} from "../utils/getAtProtoThread.js";
import {getCacheAtDids} from "../cache/getCacheAtDids.js";

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
            if((await getCacheAtDids()).includes(job.data.repo)) {
              const postLikedUri = record.subject.uri;
              const postId = await getAtProtoThread(postLikedUri);
              if(postId) {
                await UserLikesPostRelations.findOrCreate({
                  where: {
                    userId: remoteUser.id,
                    postId: postId,
                    bskyPath: operation.path
                  }
                })
              }
            } else {
              const postInDb = await Post.findOne({
                where: {
                  bskyUri: record.subject.uri
                }
              });
              if(postInDb) {
                await UserLikesPostRelations.findOrCreate({
                  where: {
                    userId: remoteUser.id,
                    postId: postInDb.id,
                    bskyPath: operation.path
                  }
                })
              }
            }
            break;
          }
          case 'app.bsky.feed.post': {
            console.log(operation);

            break;
          }
          case 'app.bsky.graph.follow': {
            const userFollowed = await getAtprotoUser(record.subject, await adminUser as Model<any, any>);
            if(userFollowed) {
              let tmp = await Follows.create({
                  followedId: userFollowed.id,
                  followerId: remoteUser.id,
                  bskyPath: operation.path,
                  accepted: true,
              });
            }
            break;
          }
          default: {
            logger.warn({message: `Bsky create type not implemented: ${record['$type']}`, record: record})
          }

        }
        break;
      }
      case 'delete': {
        // you need to check the path and do a deleete based on that.
        const deleteOperation = operation as DeleteOp;
        console.log(deleteOperation.path);
        try {
          const opName = deleteOperation.path.split('app.bsky.graph.')[0].split('/')[0];
          switch (opName){
            case 'follow': {
              await Follows.destroy({
                where:{
                  bskyPath: operation.path
                }
              })
              break;
            }
            default: {
              logger.info({message: `Bsky deleted type not implemented: ${deleteOperation.path}`})
            }
          }
        } catch (error) {
          logger.warn({
            message: `Bsky error handling delete ${deleteOperation.path}`,
            operation: deleteOperation,
            error
          })
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

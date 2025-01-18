import { Job } from 'bullmq'
import { getAtprotoUser } from '../utils/getAtprotoUser.js'
import { Follows, Post, User, UserLikesPostRelations, PostTag, Media } from '../../db.js'
import { environment } from '../../environment.js'
import { Op, Model } from 'sequelize'
import { logger } from '../../utils/logger.js'
import { DeleteOp, RepoOp } from '@skyware/firehose'
import { getAtProtoThread } from '../utils/getAtProtoThread.js'
import { getCacheAtDids } from '../cache/getCacheAtDids.js'
import { deletePostCommon } from '../../utils/deletePost.js'
import { redisCache } from '../../utils/redis.js'
import { likePostRemote } from '../../utils/activitypub/likePost.js'

const adminUser = User.findOne({
  where: {
    url: environment.adminUser
  }
})
async function processFirehose(job: Job) {
  // FIRST VERSION. THIS IS GONA BE DIRTY
  const remoteUser = await getAtprotoUser(job.data.repo, (await adminUser) as Model<any, any>)
  const operation: RepoOp = job.data.operation
  if (remoteUser && operation) {
    switch (operation.action) {
      case 'create': {
        const record = operation.record
        switch (record['$type']) {
          case 'app.bsky.feed.like': {
            if ((await getCacheAtDids()).followedDids.includes(job.data.repo)) {
              const postLikedUri = record.subject.uri
              const postId = await getAtProtoThread(postLikedUri)
              if (postId) {
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
              })
              if (postInDb) {
                await UserLikesPostRelations.findOrCreate({
                  where: {
                    userId: remoteUser.id,
                    postId: postInDb.id,
                    bskyPath: operation.path
                  }
                })
              }
            }
            break
          }
          case 'app.bsky.feed.post': {
            const postBskyUri = `at://${job.data.repo}/${operation.path}`
            await getAtProtoThread(postBskyUri, { operation, remoteUser })
            break
          }
          case 'app.bsky.feed.repost': {
            const postToBeRewooted = await getAtProtoThread(record.subject.uri)
            if (postToBeRewooted) {
              const rewootCreated = await Post.create({
                content: '',
                userId: remoteUser.id,
                parentId: postToBeRewooted,
                bskyUri: `at://${job.data.repo}/${operation.path}`,
                bskyCid: operation.cid,
                privacy: 0
              })
            }

            break
          }
          case 'app.bsky.graph.follow': {
            const userFollowed = await getAtprotoUser(record.subject, (await adminUser) as Model<any, any>)
            if (userFollowed) {
              let tmp = await Follows.create({
                followedId: userFollowed.id,
                followerId: remoteUser.id,
                bskyPath: operation.path,
                accepted: true
              })
            }
            break
          }
          default: {
            logger.warn({ message: `Bsky create type not implemented: ${record['$type']}`, record: record })
          }
        }
        break
      }
      case 'delete': {
        // you need to check the path and do a deleete based on that.
        const deleteOperation = operation as DeleteOp
        try {
          const opName = deleteOperation.path.split('app.bsky.')[1].split('/')[0]
          switch (opName) {
            case 'graph.follow': {
              await Follows.destroy({
                where: {
                  bskyPath: operation.path
                }
              })
              break
            }

            case 'feed.post': {
              const post = await Post.findOne({
                where: {
                  bskyUri: `at://${job.data.repo}/${operation.path}`
                }
              })
              if (post) {
                await redisCache.del('postAndUser:' + post.id)
                await deletePostCommon(post.id)
                const id = post.id
                if (id) {
                  let postsToDeleteUnfiltered = await Post.findAll({
                    where: {
                      parentId: id,
                      content: ''
                    }
                  })
                  const unfilteredPostIds: string[] = postsToDeleteUnfiltered.map((elem: any) => elem.id)
                  const tags = await PostTag.findAll({
                    where: {
                      postId: {
                        [Op.in]: unfilteredPostIds
                      }
                    }
                  })
                  const medias = await Media.findAll({
                    where: {
                      postId: {
                        [Op.in]: unfilteredPostIds
                      }
                    }
                  })
                  const postsThatAreNotReblogs = tags
                    .map((tag: any) => tag.postId)
                    .concat(medias.map((media: any) => media.postId))
                  const reblogsToDelete = unfilteredPostIds.filter((elem) => !postsThatAreNotReblogs.includes(elem))
                  if (reblogsToDelete) {
                    reblogsToDelete.forEach(async (elem) => {
                      await redisCache.del('postAndUser:' + elem)
                    })
                    await Post.destroy({
                      where: {
                        id: {
                          [Op.in]: reblogsToDelete
                        }
                      }
                    })
                  }
                }
              }

              break
            }

            case 'feed.like': {
              const like = await UserLikesPostRelations.findOne({
                where: {
                  bskyPath: operation.path
                }
              })

              if (like) {
                likePostRemote(like, true)
                await like.destroy()
              }
              break
            }

            default: {
              logger.info({ message: `Bsky deleted type not implemented: ${deleteOperation.path}` })
            }
          }
        } catch (error) {
          logger.warn({
            message: `Bsky error handling delete ${deleteOperation.path}`,
            operation: deleteOperation,
            error
          })
        }
        break
      }
      default: {
        logger.warn({ message: `Bsky action not implemented: ${operation.action}`, operation: operation })
      }
    }
  } else {
    logger.debug(`Failed to find remote bsky`)
  }
}

export { processFirehose }

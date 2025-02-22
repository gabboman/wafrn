import { Job } from 'bullmq'
import { getAtprotoUser } from '../utils/getAtprotoUser.js'
import { Follows, Post, User, UserLikesPostRelations, PostTag, Media, Notification } from '../../db.js'
import { environment } from '../../environment.js'
import { Op, Model } from 'sequelize'
import { logger } from '../../utils/logger.js'
import { DeleteOp, RepoOp } from '@skyware/firehose'
import { getAtProtoThread } from '../utils/getAtProtoThread.js'
import { getCacheAtDids } from '../cache/getCacheAtDids.js'
import { deletePostCommon } from '../../utils/deletePost.js'
import { redisCache } from '../../utils/redis.js'
import { likePostRemote } from '../../utils/activitypub/likePost.js'
import { createNotification } from '../../utils/pushNotifications.js'

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
                const post = await Post.findByPk(postId)
                await createNotification(
                  {
                    notificationType: 'LIKE',
                    postId: postId,
                    userId: remoteUser.id,
                    notifiedUserId: post?.userId
                  },
                  {
                    postContent: post?.content,
                    userUrl: remoteUser.url
                  }
                )
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
                isReblog: true,
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
              let tmp = await Follows.findOrCreate({
                where: {
                  followedId: userFollowed.id,
                  followerId: remoteUser.id
                }
              })
              const follow = tmp[0]
              follow.bskyPath = operation.path
              follow.accepted = true
              await follow.save()
              createNotification(
                {
                  notificationType: 'FOLLOW',
                  userId: remoteUser.id,
                  notifiedUserId: userFollowed.id
                },
                {
                  userUrl: remoteUser.url
                }
              )
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
              const followToBeDestroyed = await Follows.findOne({
                where: {
                  bskyPath: operation.path
                }
              })
              if (followToBeDestroyed) {
                await Notification.destroy({
                  where: {
                    notificationType: 'FOLLOW',
                    userId: followToBeDestroyed.followerId,
                    notifiedUserId: followToBeDestroyed.followedId
                  }
                })
                await followToBeDestroyed.destroy()
              }
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
                      content: '',
                      isReblog: true
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
                await Notification.destroy({
                  where: {
                    notificationType: 'LIKE',
                    postId: like.postId,
                    userId: like.userId
                  }
                })
                await like.destroy()
              }
              break
            }
            default: {
              logger.info({
                message: `Bsky deleted type not implemented: ${deleteOperation.path}`,
                operation: deleteOperation
              })
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

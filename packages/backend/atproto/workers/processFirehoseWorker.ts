import { Job } from 'bullmq'
import { getAtprotoUser } from '../utils/getAtprotoUser.js'
import {
  Follows,
  Post,
  User,
  UserLikesPostRelations,
  PostTag,
  Media,
  Notification,
  Blocks
} from '../../models/index.js'
import { Op, Model } from 'sequelize'
import { logger } from '../../utils/logger.js'
import { DeleteOp, RepoOp } from '@skyware/firehose'
import { getAtProtoThread } from '../utils/getAtProtoThread.js'
import { getCacheAtDids } from '../cache/getCacheAtDids.js'
import { deletePostCommon } from '../../utils/deletePost.js'
import { redisCache } from '../../utils/redis.js'
import { likePostRemote } from '../../utils/activitypub/likePost.js'
import { createNotification } from '../../utils/pushNotifications.js'
import { Privacy } from '../../models/post.js'
import { completeEnvironment } from '../../utils/backendOptions.js'
import { wait } from '../../utils/wait.js'

const adminUser = User.findOne({
  where: {
    url: completeEnvironment.adminUser
  }
})
async function processFirehose(job: Job) {
  // FIRST VERSION. THIS IS GONA BE DIRTY
  const remoteUser = await getAtprotoUser(job.data.repo, (await adminUser) as User)
  const operation: RepoOp = job.data.operation
  if (remoteUser && operation) {
    switch (operation.action) {
      case 'create': {
        const record = operation.record as any
        switch (record['$type']) {
          case 'app.bsky.feed.like': {
            let user = undefined
            let likedPostId = undefined
            try {
              if ((await getCacheAtDids()).followedDids.has(job.data.repo)) {
                const postLikedUri = record.subject.uri
                const postId = await getAtProtoThread(postLikedUri)
                if (postId) {
                  user = remoteUser.url
                  likedPostId = postId
                  const [like, likeCreated] = await UserLikesPostRelations.findOrCreate({
                    where: {
                      userId: remoteUser.id,
                      postId: postId
                    },
                    defaults: {
                      userId: remoteUser.id,
                      postId: postId,
                      bskyPath: operation.path
                    }
                  })
                  const post = await Post.findByPk(postId)
                  if (post && likeCreated) {
                    await createNotification(
                      {
                        notificationType: 'LIKE',
                        postId: postId,
                        userId: remoteUser.id,
                        notifiedUserId: post.userId
                      },
                      {
                        postContent: post.content,
                        userUrl: remoteUser.url
                      }
                    )
                  }
                }
              } else {
                const postInDb = await Post.findOne({
                  where: {
                    bskyUri: record.subject.uri
                  }
                })
                if (postInDb) {
                  user = remoteUser.url
                  likedPostId = postInDb.id
                  await UserLikesPostRelations.findOrCreate({
                    where: {
                      userId: remoteUser.id,
                      postId: postInDb.id
                    },
                    defaults: {
                      bskyPath: operation.path,
                      userId: remoteUser.id,
                      postId: postInDb.id
                    }
                  })
                  // TODO fix notification not being created

                  await createNotification(
                    {
                      notificationType: 'LIKE',
                      postId: postInDb.id,
                      userId: remoteUser.id,
                      notifiedUserId: postInDb.userId
                    },
                    {
                      postContent: postInDb.content,
                      userUrl: remoteUser.url
                    }
                  )
                }
              }
            } catch (error) {
              logger.debug({
                message: `Error creating bluesky like`,
                user,
                likedPostId,
                record,
                error
              })
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
              try {
                const parent = await Post.findByPk(postToBeRewooted)
                await Post.findOrCreate({
                  where: {
                    [Op.or]: [
                      {
                        bskyUri: `at://${job.data.repo}/${operation.path}`
                      },
                      {
                        bskyCid: operation.cid
                      }
                    ]
                  },
                  defaults: {
                    content: '',
                    isReblog: true,
                    userId: remoteUser.id,
                    parentId: postToBeRewooted,
                    bskyUri: `at://${job.data.repo}/${operation.path}`,
                    bskyCid: operation.cid,
                    privacy: Privacy.Public
                  }
                })
                await createNotification(
                  {
                    notificationType: 'REWOOT',
                    postId: parent?.id,
                    notifiedUserId: parent?.userId as string,
                    userId: remoteUser.id
                  },
                  {
                    postContent: parent?.content,
                    userUrl: remoteUser.url
                  }
                )
              } catch (error) {
                logger.info({
                  message: `Error with bsky rewoot`,
                  repo: job.data?.repo,
                  operation: operation,
                  error: error
                })
              }
            }
            break
          }
          case 'app.bsky.graph.follow': {
            const userFollowed = await getAtprotoUser(record.subject, (await adminUser) as User)
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
          case 'app.bsky.graph.block': {
            const userBlocked = await getAtprotoUser(record.subject, (await adminUser) as User)
            if (userBlocked) {
              await Blocks.create({
                blockedId: userBlocked.id,
                blockerId: remoteUser.id,
                bskyPath: operation.path
              })
            }
            break
          }
          case 'app.bsky.feed.threadgate': {
            const postBskyUri = (operation.record as any).post
            if (postBskyUri) {
              await getAtProtoThread(postBskyUri, undefined, true)
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
            case 'feed.repost': {
              const post = await Post.findOne({
                where: {
                  bskyUri: `at://${job.data.repo}/${operation.path}`
                }
              })
              if (post) {
                await post.destroy()
              }
              break
            }
            default: {
              logger.info({
                message: `Bsky delete type not implemented: ${deleteOperation.path}`,
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
      case 'update': {
      }
      default: {
        const operationType = (operation.record as any)['$type']
        switch (operationType) {
          case 'app.bsky.feed.threadgate': {
            const postBskyUri = (operation.record as any).post
            if (postBskyUri) {
              await getAtProtoThread(postBskyUri, undefined, true)
            }
            break
          }
        }
        logger.warn({ message: `Bsky action not implemented: ${operation.action}`, operation: operation })
      }
    }
  } else {
    logger.debug(`Failed to find remote bsky`)
  }
}

export { processFirehose }

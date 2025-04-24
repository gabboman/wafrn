import { Model, Op, Sequelize } from 'sequelize'
import { logger } from '../logger.js'
import { postPetitionSigned } from '../activitypub/postPetitionSigned.js'
import { postToJSONLD } from '../activitypub/postToJSONLD.js'
import { LdSignature } from '../activitypub/rsa2017.js'
import {
  FederatedHost,
  Post,
  User,
  PostHostView,
  RemoteUserPostView,
  sequelize,
  Media,
  Quotes,
  PostTag
} from '../../models/index.js'
import { environment } from '../../environment.js'
import { Job, Queue } from 'bullmq'
import { Agent, BskyAgent, CredentialSession } from '@atproto/api'
import { wait } from '../wait.js'
import dompurify from 'isomorphic-dompurify'
import { postToAtproto } from "../../atproto/utils/postToAtproto.js";
import { getAtProtoSession } from "../../atproto/utils/getAtProtoSession.js";

const processPostViewQueue = new Queue('processRemoteView', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 25000
    },
    removeOnFail: 25000
  }
})

const sendPostQueue = new Queue('sendPostToInboxes', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 25000
    },
    removeOnFail: 25000
  }
})
async function prepareSendRemotePostWorker(job: Job) {
  // TODO fix this! this is dirtier than my unwashed gim clothes
  await wait(1500)
  //async function sendRemotePost(localUser: any, post: any) {
  const post = await Post.findByPk(job.id)
  if (!post)
    return

  const parent = post.parentId ? await Post.findByPk(post.parentId) : undefined;
  const parentPoster = parent ? await User.findByPk(parent.userId) : undefined
  const localUser = await User.findByPk(post.userId)
  if (post.privacy === 0 && localUser?.enableBsky && environment.enableBsky) {
    try {
      // if parent has no bsky data we dont reblog
      if (!parent || parent.bskyUri) {
        // ok the user has bluesky time to send the post
        const agent = await getAtProtoSession(localUser)
        let isReblog = false;
        if (post.content == '' && post.content_warning == "" && post.parentId) {
          const mediaCount = await Media.count({
            where: {
              postId: post.id
            }
          })
          const quotesCount = await Quotes.count({
            where: {
              quoterPostId: post.id
            }
          })
          const tagsCount = await PostTag.count({
            where: {
              postId: post.id
            }
          })
          if (mediaCount + quotesCount + tagsCount === 0) {
            isReblog = true;
            if (parent?.bskyUri) {
              const { uri } = await agent.repost(parent.bskyUri, parent.bskyCid)
              post.bskyUri = uri;
              await post.save();
            }
          }
        } if (!isReblog) {
          const bskyPost = await agent.post(await postToAtproto(post, agent));
          post.bskyUri = bskyPost.uri;
          post.bskyCid = bskyPost.cid;
          await post.save();
        }
      }

    } catch (error) {
      logger.warn({
        message: 'Error while posting to bsky',
        error: error
      })
    }
  }
  // we check if we need to send the post to fedi
  if (localUser && (!parent || (!parent.bskyUri || !parentPoster?.url.startsWith('@')))) {
    // servers with shared inbox
    let serversToSendThePost: FederatedHost[] = []
    const localUserFollowers = await localUser.getFollower()
    const followersServers = [...new Set(localUserFollowers.map((el: any) => el.federatedHostId))]
    // for servers with no shared inbox
    let usersToSendThePost = await FederatedHost.findAll({
      where: {
        publicInbox: { [Op.eq]: null },
        blocked: false
      },
      include: [
        {
          required: true,
          model: User,
          attributes: ['remoteInbox', 'id'],
          where: {
            banned: false,
            id: {
              [Op.in]: (await localUser.getFollower()).map((usr: any) => usr.id)
            }
          }
        }
      ]
    })
    // mentioned users
    const mentionedUsers = await post.getMentionPost()
    switch (post.privacy) {
      case 2: {
        break
      }
      case 10: {
        serversToSendThePost = []
        usersToSendThePost = []
        break
      }
      default: {
        serversToSendThePost = await FederatedHost.findAll({
          where: {
            publicInbox: { [Op.ne]: null },
            blocked: { [Op.ne]: true },
            [Op.or]: [
              {
                id: {
                  [Op.in]: followersServers
                }
              },
              {
                friendServer: true
              }
            ]
          }
        })
      }
    }

    let userViews = usersToSendThePost
      .flatMap((usr: any) => usr.users)
      .map((elem: any) => {
        return {
          userId: elem.id,
          postId: post.id
        }
      })
      .concat(
        mentionedUsers.map((elem: any) => {
          return {
            userId: elem.id,
            postId: post.id
          }
        })
      )


    // we store the fact that we have sent the post in a queue
    await processPostViewQueue.addBulk(
      serversToSendThePost.map((host: any) => {
        return {
          name: host.displayName + post.id,
          data: {
            postId: post.id,
            federatedHostId: host.id,
            userId: ''
          }
        }
      })
    )
    // we store the fact that we have sent the post in a queue
    await processPostViewQueue.addBulk(
      userViews.map((userView: any) => {
        return {
          name: userView.userId + post.id,
          data: {
            postId: post.id,
            federatedHostId: '',
            userId: userView.userId
          }
        }
      })
    )

    await RemoteUserPostView.bulkCreate(userViews, {
      ignoreDuplicates: true
    })

    const objectToSend = await postToJSONLD(post.id)
    const ldSignature = new LdSignature()
    if (localUser.privateKey) {
      const bodySignature = await ldSignature.signRsaSignature2017(
        objectToSend,
        localUser.privateKey,
        `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLocaleLowerCase()}`,
        environment.instanceUrl,
        new Date(post.createdAt)
      )

      const objectToSendComplete = { ...objectToSend, signature: bodySignature.signature }
      if (mentionedUsers?.length > 0) {
        const mentionedInboxes = mentionedUsers.map((elem: any) => elem.remoteInbox)
        for await (const remoteInbox of mentionedInboxes) {
          try {
            const response = await postPetitionSigned(objectToSendComplete, localUser, remoteInbox)
          } catch (error) {
            logger.debug(error)
          }
        }
      }

      if (serversToSendThePost?.length > 0 || usersToSendThePost?.length > 0) {
        let inboxes: string[] = []
        inboxes = inboxes.concat(serversToSendThePost.map((elem: any) => elem.publicInbox))
        usersToSendThePost?.forEach((server: any) => {
          inboxes = inboxes.concat(server.users.map((elem: any) => elem.remoteInbox))
        })
        const addSendPostToQueuePromises: Promise<any>[] = []
        logger.debug(`Preparing send post. ${inboxes.length} inboxes`)
        for (const inboxChunk of inboxes) {
          addSendPostToQueuePromises.push(
            sendPostQueue.add(
              'sencChunk',
              {
                objectToSend: objectToSendComplete,
                petitionBy: localUser.dataValues,
                inboxList: inboxChunk
              },
              {
                priority: 1
              }
            )
          )
        }
        await Promise.allSettled(addSendPostToQueuePromises)
      }
    }
  }

}

export { prepareSendRemotePostWorker }

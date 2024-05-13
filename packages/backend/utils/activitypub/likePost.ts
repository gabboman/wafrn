import { Op, Sequelize } from 'sequelize'
import { Emoji, FederatedHost, Post, User, sequelize } from '../../db'
import { environment } from '../../environment'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject'
import { postPetitionSigned } from './postPetitionSigned'
import { logger } from '../logger'
import { Queue } from 'bullmq'
import _ from 'underscore'
import { emojiToAPTag } from './emojiToAPTag'

const sendPostQueue = new Queue('sendPostToInboxes', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: 25000
  }
})

async function likePostRemote(like: any, dislike = false) {
  const user = await User.findOne({
    where: {
      id: like.userId
    }
  })
  const likedPost = await Post.findOne({
    where: {
      id: like.postId
    },
    include: [
      {
        model: User,
        as: 'user'
      }
    ]
  })
  const stringMyFollowers = `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`
  const ownerOfLikedPost = likedPost.user.remoteId
    ? likedPost.user.remoteId
    : `${environment.frontendUrl}/fediverse/blog/${likedPost.user.url}`
  const likeObject: activityPubObject = !dislike
    ? {
        '@context': ['https://www.w3.org/ns/activitystreams', `${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
        actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
        to:
          likedPost.privacy / 1 === 10
            ? [ownerOfLikedPost]
            : likedPost.privacy / 1 === 0
            ? ['https://www.w3.org/ns/activitystreams#Public', stringMyFollowers]
            : [stringMyFollowers],
        cc: likedPost.privacy / 1 === 0 ? [ownerOfLikedPost] : [],
        id: `${environment.frontendUrl}/fediverse/likes/${like.userId}/${like.postId}`,
        object: likedPost.remotePostId
          ? likedPost.remotePostId
          : `${environment.frontendUrl}/fediverse/post/${likedPost.id}`,
        type: 'Like'
      }
    : {
        '@context': ['https://www.w3.org/ns/activitystreams', `${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
        actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
        to:
          likedPost.privacy / 1 === 10
            ? [ownerOfLikedPost]
            : likedPost.privacy / 1 === 0
            ? ['https://www.w3.org/ns/activitystreams#Public', stringMyFollowers]
            : [stringMyFollowers],
        cc: likedPost.privacy / 1 === 0 ? [ownerOfLikedPost] : [],
        id: `${environment.frontendUrl}/fediverse/undo/likes/${like.userId}/${like.postId}`,
        object: `${environment.frontendUrl}/fediverse/likes/${like.userId}/${like.postId}`,
        type: 'Undo'
      }
  // petition to owner of the post:
  const ownerOfPostLikePromise = likedPost.user.remoteInbox
    ? postPetitionSigned(likeObject, user, likedPost.user.remoteInbox)
    : true
  // servers with shared inbox
  let serversToSendThePost = await FederatedHost.findAll({
    where: {
      publicInbox: { [Op.ne]: null },
      blocked: { [Op.ne]: true },

      [Op.or]: [
        {
          literal: sequelize.literal(
            `id in (SELECT federatedHostId from users where users.id IN (SELECT followerId from follows where followedId = '${like.userId}') and federatedHostId is not NULL)`
          )
        },
        {
          friendServer: true
        }
      ]
    }
  })
  // for servers with no shared inbox
  const usersToSendThePost = [await User.findByPk(likedPost.userId)]

  try {
    const ownerOfPostLikeResponse = await ownerOfPostLikePromise
  } catch (error) {
    logger.debug(error)
  }

  await Promise.all([serversToSendThePost, usersToSendThePost])
  serversToSendThePost = await serversToSendThePost
  // TODO convert this into a function. Code is repeated and a better thing should be made
  if (serversToSendThePost?.length > 0 || usersToSendThePost?.length > 0) {
    let inboxes: string[] = []
    inboxes = inboxes.concat(serversToSendThePost.map((elem: any) => elem.publicInbox))
    inboxes = inboxes.concat(usersToSendThePost.map((elem: any) => (elem.remoteInbox ? elem.remoteInbox : '')))
    for await (const inboxChunk of _.chunk(inboxes, 10)) {
      await sendPostQueue.add(
        'sencChunk',
        {
          objectToSend: likeObject,
          petitionBy: user.dataValues,
          inboxList: inboxChunk
        },
        {
          priority: Number.MAX_SAFE_INTEGER
        }
      )
    }
  }
}

async function emojiReactRemote(react: any, undo = false) {

  const user = await User.findOne({
    where: {
      id: react.userId
    }
  })
  const reactedPost = await Post.findOne({
    where: {
      id: react.postId
    },
    include: [
      {
        model: User,
        as: 'user'
      }
    ]
  })
  const emoji = await Emoji.findByPk(react.emojiId)
  const stringMyFollowers = `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`
  const ownerOfreactedPost = reactedPost.user.remoteId
    ? reactedPost.user.remoteId
    : `${environment.frontendUrl}/fediverse/blog/${reactedPost.user.url}`
  const likeObject: activityPubObject = !undo
    ? {
        '@context': ['https://www.w3.org/ns/activitystreams', `${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
        actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
        to:
          reactedPost.privacy / 1 === 10
            ? [ownerOfreactedPost]
            : reactedPost.privacy / 1 === 0
            ? ['https://www.w3.org/ns/activitystreams#Public', stringMyFollowers]
            : [stringMyFollowers],
        cc: reactedPost.privacy / 1 === 0 ? [ownerOfreactedPost] : [],
        id: `${environment.frontendUrl}/fediverse/emojiReact/${react.userId}/${react.postId}/${react.emojiId}`,
        object: reactedPost.remotePostId
          ? reactedPost.remotePostId
          : `${environment.frontendUrl}/fediverse/post/${reactedPost.id}`,
        tag: [emojiToAPTag(emoji)],
        content: emoji.name,
        type: 'EmojiReact'
      }
    : {
        '@context': ['https://www.w3.org/ns/activitystreams', `${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
        actor: `${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
        to:
          reactedPost.privacy / 1 === 10
            ? [ownerOfreactedPost]
            : reactedPost.privacy / 1 === 0
            ? ['https://www.w3.org/ns/activitystreams#Public', stringMyFollowers]
            : [stringMyFollowers],
        cc: reactedPost.privacy / 1 === 0 ? [ownerOfreactedPost] : [],
        id: `${environment.frontendUrl}/fediverse/undo/emojiReact/${react.userId}/${react.postId}/${react.emojiId}`,
        object: `${environment.frontendUrl}/fediverse/emojiReact/${react.userId}/${react.postId}/${react.emojiId}`,
        type: 'Undo'
      }
  // petition to owner of the post:
  const ownerOfPostLikePromise = reactedPost.user.remoteInbox
    ? postPetitionSigned(likeObject, user, reactedPost.user.remoteInbox)
    : true
  // servers with shared inbox
  let serversToSendThePost = await FederatedHost.findAll({
    where: {
      publicInbox: { [Op.ne]: null },
      blocked: { [Op.ne]: true },

      [Op.or]: [
        {
          literal: sequelize.literal(
            `id in (SELECT federatedHostId from users where users.id IN (SELECT followerId from follows where followedId = '${react.userId}') and federatedHostId is not NULL)`
          )
        },
        {
          friendServer: true
        }
      ]
    }
  })
  // for servers with no shared inbox
  const usersToSendThePost = [await User.findByPk(reactedPost.userId)]

  try {
    const ownerOfPostLikeResponse = await ownerOfPostLikePromise
  } catch (error) {
    logger.debug(error)
  }

  await Promise.all([serversToSendThePost, usersToSendThePost])
  serversToSendThePost = await serversToSendThePost
  // TODO convert this into a function. Code is repeated and a better thing should be made
  if (serversToSendThePost?.length > 0 || usersToSendThePost?.length > 0) {
    let inboxes: string[] = []
    inboxes = inboxes.concat(serversToSendThePost.map((elem: any) => elem.publicInbox))
    inboxes = inboxes.concat(usersToSendThePost.map((elem: any) => (elem.remoteInbox ? elem.remoteInbox : '')))
    for await (const inboxChunk of _.chunk(inboxes, 10)) {
      await sendPostQueue.add(
        'sencChunk',
        {
          objectToSend: likeObject,
          petitionBy: user.dataValues,
          inboxList: inboxChunk
        },
        {
          priority: Number.MAX_SAFE_INTEGER
        }
      )
    }
  }
}

export { likePostRemote, emojiReactRemote }

import { Op, Sequelize } from 'sequelize'
import { Emoji, EmojiReaction, FederatedHost, Post, User, sequelize } from '../../models/index.js'
import { completeEnvironment } from '../backendOptions.js'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { postPetitionSigned } from './postPetitionSigned.js'
import { logger } from '../logger.js'
import { Queue } from 'bullmq'
import _ from 'underscore'
import { emojiToAPTag } from './emojiToAPTag.js'
import { Privacy } from '../../models/post.js'

const sendPostQueue = new Queue('sendPostToInboxes', {
  connection: completeEnvironment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: true
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

  if (!user || !likedPost) return

  const stringMyFollowers = `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`
  const ownerOfLikedPost = likedPost.user.remoteId
    ? likedPost.user.remoteId
    : `${completeEnvironment.frontendUrl}/fediverse/blog/${likedPost.user.url}`
  const likeObject: activityPubObject = !dislike
    ? {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          `${completeEnvironment.frontendUrl}/contexts/litepub-0.1.jsonld`
        ],
        actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
        to:
          likedPost.privacy / 1 === Privacy.DirectMessage
            ? [ownerOfLikedPost]
            : likedPost.privacy / 1 === Privacy.Public
            ? ['https://www.w3.org/ns/activitystreams#Public', stringMyFollowers]
            : [stringMyFollowers],
        cc: likedPost.privacy / 1 === Privacy.Public ? [ownerOfLikedPost] : [],
        id: `${completeEnvironment.frontendUrl}/fediverse/likes/${like.userId}/${like.postId}`,
        object: likedPost.remotePostId
          ? likedPost.remotePostId
          : `${completeEnvironment.frontendUrl}/fediverse/post/${likedPost.id}`,
        type: 'Like'
      }
    : {
        '@context': [
          'https://www.w3.org/ns/activitystreams',
          `${completeEnvironment.frontendUrl}/contexts/litepub-0.1.jsonld`
        ],
        actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
        to:
          likedPost.privacy / 1 === Privacy.DirectMessage
            ? [ownerOfLikedPost]
            : likedPost.privacy / 1 === Privacy.Public
            ? ['https://www.w3.org/ns/activitystreams#Public', stringMyFollowers]
            : [stringMyFollowers],
        cc: likedPost.privacy / 1 === Privacy.Public ? [ownerOfLikedPost] : [],
        id: `${completeEnvironment.frontendUrl}/fediverse/undo/likes/${like.userId}/${like.postId}`,
        object: `${completeEnvironment.frontendUrl}/fediverse/likes/${like.userId}/${like.postId}`,
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
        sequelize.literal(
          `"id" in (SELECT "federatedHostId" from "users" where "users"."id" IN (SELECT "followerId" from "follows" where "followedId" = '${like.userId}') and "federatedHostId" is not NULL)`
        ),
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
    for await (const inboxChunk of inboxes) {
      await sendPostQueue.add(
        'sendChunk',
        {
          objectToSend: likeObject,
          petitionBy: user.dataValues,
          inboxList: inboxChunk
        },
        {
          priority: 2097152,
          delay: 500
        }
      )
    }
  }
}

async function emojiReactRemote(react: EmojiReaction, undo = false) {
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
  if (!user || !reactedPost) return

  const emoji = await Emoji.findByPk(react.emojiId)
  const stringMyFollowers = `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}/followers`
  const ownerOfreactedPost = reactedPost.user.remoteId
    ? reactedPost.user.remoteId
    : `${completeEnvironment.frontendUrl}/fediverse/blog/${reactedPost.user.url}`
  let emojireactObject: activityPubObject = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      `${completeEnvironment.frontendUrl}/contexts/litepub-0.1.jsonld`
    ],
    actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
    to:
      reactedPost.privacy / 1 === Privacy.DirectMessage
        ? [ownerOfreactedPost]
        : reactedPost.privacy / 1 === Privacy.Public
        ? ['https://www.w3.org/ns/activitystreams#Public', stringMyFollowers]
        : [stringMyFollowers],
    cc: reactedPost.privacy / 1 === Privacy.Public ? [ownerOfreactedPost] : [],
    id: `${completeEnvironment.frontendUrl}/fediverse/emojiReact/${react.userId}/${react.postId}/${react.emojiId}`,
    object: reactedPost.remotePostId
      ? reactedPost.remotePostId
      : `${completeEnvironment.frontendUrl}/fediverse/post/${reactedPost.id}`,
    tag: emoji ? [emojiToAPTag(emoji)] : undefined,
    content: emoji ? emoji.name : react.content,
    type: 'EmojiReact'
  }
  if (undo) {
    emojireactObject = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        `${completeEnvironment.frontendUrl}/contexts/litepub-0.1.jsonld`
      ],
      actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
      to:
        reactedPost.privacy / 1 === Privacy.DirectMessage
          ? [ownerOfreactedPost]
          : reactedPost.privacy / 1 === Privacy.Public
          ? ['https://www.w3.org/ns/activitystreams#Public', stringMyFollowers]
          : [stringMyFollowers],
      cc: reactedPost.privacy / 1 === Privacy.Public ? [ownerOfreactedPost] : [],
      id: `${completeEnvironment.frontendUrl}/fediverse/undo/emojiReact/${react.userId}/${react.postId}/${react.emojiId}`,
      object: emojireactObject,
      type: 'Undo'
    }
  }
  // petition to owner of the post:
  const ownerOfPostLikePromise = reactedPost.user.remoteInbox
    ? postPetitionSigned(emojireactObject, user, reactedPost.user.remoteInbox)
    : true
  // servers with shared inbox
  let serversToSendThePost = await FederatedHost.findAll({
    where: {
      publicInbox: { [Op.ne]: null },
      blocked: { [Op.ne]: true },

      [Op.or]: [
        sequelize.literal(
          `"id" in (SELECT "federatedHostId" from "users" where "users"."id" IN (SELECT "followerId" from "follows" where "followedId" = '${react.userId}') and "federatedHostId" is not NULL)`
        ),
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
    for await (const inboxChunk of inboxes) {
      await sendPostQueue.add(
        'sendChunk',
        {
          objectToSend: emojireactObject,
          petitionBy: user.dataValues,
          inboxList: inboxChunk
        },
        {
          priority: 2097152
        }
      )
    }
  }
}

export { likePostRemote, emojiReactRemote }

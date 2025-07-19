import { Op } from 'sequelize'
import {
  Blocks,
  Emoji,
  FederatedHost,
  Media,
  Post,
  PostMentionsUserRelation,
  ServerBlock,
  PostTag,
  User,
  sequelize,
  Ask,
  Notification
} from '../../models/index.js'
import { completeEnvironment } from '../backendOptions.js'
import { logger } from '../logger.js'
import { getRemoteActor } from './getRemoteActor.js'
import { getPetitionSigned } from './getPetitionSigned.js'
import { fediverseTag } from '../../interfaces/fediverse/tags.js'
import { loadPoll } from './loadPollFromPost.js'
import { getApObjectPrivacy } from './getPrivacy.js'
import dompurify from 'isomorphic-dompurify'
import { Queue } from 'bullmq'
import { bulkCreateNotifications } from '../pushNotifications.js'
import { getDeletedUser } from '../cacheGetters/getDeletedUser.js'
import { Privacy } from '../../models/post.js'
import { getAtProtoThread } from '../../atproto/utils/getAtProtoThread.js'
import * as cheerio from 'cheerio'

const updateMediaDataQueue = new Queue('processRemoteMediaData', {
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

async function getPostThreadRecursive(
  user: any,
  remotePostId: string | null,
  remotePostObject?: any,
  localPostToForceUpdate?: string,
  options?: any
) {
  if (remotePostId === null) return

  const deletedUser = getDeletedUser()
  try {
    remotePostId.startsWith(`${completeEnvironment.frontendUrl}/fediverse/post/`)
  } catch (error) {
    logger.info({
      message: 'Error with url on post',
      object: remotePostId,
      stack: new Error().stack
    })
    return
  }
  if (remotePostId.startsWith(`${completeEnvironment.frontendUrl}/fediverse/post/`)) {
    // we are looking at a local post
    const partToRemove = `${completeEnvironment.frontendUrl}/fediverse/post/`
    const postId = remotePostId.substring(partToRemove.length)
    return await Post.findOne({
      where: {
        id: postId
      }
    })
  }
  if (completeEnvironment.enableBsky && remotePostId.startsWith('at://')) {
    // Bluesky post. Likely coming from an import
    const postInDatabase = await Post.findOne({
      where: {
        bskyUri: remotePostId
      }
    })
    if (postInDatabase) {
      return postInDatabase
    } else if (!remotePostObject) {
      const postId = await getAtProtoThread(remotePostId)
      return await Post.findByPk(postId)
    }
  }
  const postInDatabase = await Post.findOne({
    where: {
      remotePostId: remotePostId
    }
  })
  if (postInDatabase && !localPostToForceUpdate) {
    if (postInDatabase.remotePostId) {
      const parentPostPetition = await getPetitionSigned(user, postInDatabase.remotePostId)
      if (parentPostPetition) {
        await loadPoll(parentPostPetition, postInDatabase, user)
      }
    }
    return postInDatabase
  } else {
    try {
      const postPetition = remotePostObject ? remotePostObject : await getPetitionSigned(user, remotePostId)
      if (postPetition && !localPostToForceUpdate) {
        const remotePostInDatabase = await Post.findOne({
          where: {
            remotePostId: postPetition.id
          }
        })
        if (remotePostInDatabase) {
          if (remotePostInDatabase.remotePostId) {
            const parentPostPetition = await getPetitionSigned(user, remotePostInDatabase.remotePostId)
            if (parentPostPetition) {
              await loadPoll(parentPostPetition, remotePostInDatabase, user)
            }
          }
          return remotePostInDatabase
        }
      }
      // peertube: what the fuck
      let actorUrl = postPetition.attributedTo
      if (Array.isArray(actorUrl)) {
        actorUrl = actorUrl[0].id
      }
      const remoteUser = await getRemoteActor(actorUrl, user)
      if (remoteUser) {
        const remoteHost = (await FederatedHost.findByPk(remoteUser.federatedHostId as string)) as FederatedHost
        const remoteUserServerBaned = remoteHost?.blocked ? remoteHost.blocked : false
        // HACK: some implementations (GTS IM LOOKING AT YOU) may send a single element instead of an array
        // I should had used a funciton instead of this dirty thing, BUT you see, its late. Im eepy
        // also this code is CRITICAL. A failure here is a big problem. So this hack it is
        postPetition.tag = !Array.isArray(postPetition.tag)
          ? [postPetition.tag].filter((elem) => elem)
          : postPetition.tag
        const medias: any[] = []
        const fediTags: fediverseTag[] = [
          ...new Set<fediverseTag>(
            postPetition.tag
              ?.filter((elem: fediverseTag) =>
                [
                  postPetition.tag.some((tag: fediverseTag) => tag.type == 'WafrnHashtag') ? 'WafrnHashtag' : 'Hashtag'
                ].includes(elem.type)
              )
              .map((elem: fediverseTag) => {
                return { href: elem.href, type: elem.type, name: elem.name }
              })
          )
        ]
        let fediMentions: fediverseTag[] = postPetition.tag?.filter((elem: fediverseTag) => elem.type === 'Mention')
        if (fediMentions == undefined) {
          fediMentions = postPetition.to.map((elem: string) => {
            return { href: elem }
          })
        }
        const fediEmojis: any[] = postPetition.tag?.filter((elem: fediverseTag) => elem.type === 'Emoji')

        const privacy = getApObjectPrivacy(postPetition, remoteUser)

        let postTextContent = `${postPetition.content ? postPetition.content : ''}` // Fix for bridgy giving this as undefined
        if (postPetition.type == 'Video') {
          // peertube federation. We just add a link to the video, federating this is HELL
          postTextContent = postTextContent + ` <a href="${postPetition.id}" target="_blank">${postPetition.id}</a>`
        }
        if (postPetition.tag && postPetition.tag.some((tag: fediverseTag) => tag.type === 'WafrnHashtag')) {
          // Ok we have wafrn hashtags with us, we are probably talking with another wafrn! Crazy, I know
          const dom = cheerio.load(postTextContent)
          const tags = dom('a.hashtag').html('')
          postTextContent = dom.html()
        }
        if (
          postPetition.attachment &&
          postPetition.attachment.length > 0 &&
          (!remoteUser.banned || options?.allowMediaFromBanned)
        ) {
          for await (const remoteFile of postPetition.attachment) {
            if (remoteFile.type !== 'Link') {
              const wafrnMedia = await Media.create({
                url: remoteFile.url,
                NSFW: postPetition?.sensitive,
                userId: remoteUserServerBaned || remoteUser.banned ? (await deletedUser)?.id : remoteUser.id,
                description: remoteFile.name,
                ipUpload: 'IMAGE_FROM_OTHER_FEDIVERSE_INSTANCE',
                mediaOrder: postPetition.attachment.indexOf(remoteFile), // could be non consecutive but its ok
                external: true,
                mediaType: remoteFile.mediaType ? remoteFile.mediaType : '',
                blurhash: remoteFile.blurhash ? remoteFile.blurhash : null,
                height: remoteFile.height ? remoteFile.height : null,
                width: remoteFile.width ? remoteFile.width : null
              })
              if (!wafrnMedia.mediaType || (wafrnMedia.mediaType?.startsWith('image') && !wafrnMedia.width)) {
                await updateMediaDataQueue.add(`updateMedia:${wafrnMedia.id}`, {
                  mediaId: wafrnMedia.id
                })
              }
              medias.push(wafrnMedia)
            } else {
              postTextContent = '' + postTextContent + `<a href="${remoteFile.href}" >${remoteFile.href}</a>`
            }
          }
        }
        const lemmyName = postPetition.name ? postPetition.name : ''
        postTextContent = postTextContent ? postTextContent : `<p>${lemmyName}</p>`
        let createdAt = new Date(postPetition.published)
        if (createdAt.getTime() > new Date().getTime()) {
          createdAt = new Date()
        }
        const postToCreate: any = {
          content: '' + postTextContent,
          content_warning: postPetition.summary
            ? postPetition.summary
            : remoteUser.NSFW
            ? 'User is marked as NSFW by this instance staff. Possible NSFW without tagging'
            : '',
          createdAt: createdAt,
          updatedAt: createdAt,
          userId: remoteUserServerBaned || remoteUser.banned ? (await deletedUser)?.id : remoteUser.id,
          remotePostId: postPetition.id,
          privacy: privacy
        }

        if (postPetition.name) {
          postToCreate.title = postPetition.name
        }

        const mentionedUsersIds: string[] = []
        const quotes: any[] = []
        try {
          if (!remoteUser.banned && !remoteUserServerBaned) {
            for await (const mention of fediMentions) {
              let mentionedUser
              if (mention.href?.indexOf(completeEnvironment.frontendUrl) !== -1) {
                const username = mention.href?.substring(
                  `${completeEnvironment.frontendUrl}/fediverse/blog/`.length
                ) as string
                mentionedUser = await User.findOne({
                  where: sequelize.where(sequelize.fn('lower', sequelize.col('url')), username.toLowerCase())
                })
              } else {
                mentionedUser = await getRemoteActor(mention.href, user)
              }
              if (
                mentionedUser?.id &&
                mentionedUser.id != (await deletedUser)?.id &&
                !mentionedUsersIds.includes(mentionedUser.id)
              ) {
                mentionedUsersIds.push(mentionedUser.id)
              }
            }
          }
        } catch (error) {
          logger.info('problem processing mentions')
          logger.info(error)
        }

        if (postPetition.inReplyTo && postPetition.id !== postPetition.inReplyTo) {
          const parent = await getPostThreadRecursive(
            user,
            postPetition.inReplyTo.id ? postPetition.inReplyTo.id : postPetition.inReplyTo
          )
          postToCreate.parentId = parent?.id
        }

        const existingPost = localPostToForceUpdate ? await Post.findByPk(localPostToForceUpdate) : undefined

        if (existingPost) {
          existingPost.set(postToCreate)
          await existingPost.save()
          await loadPoll(postPetition, existingPost, user)
        }

        const newPost = existingPost ? existingPost : await Post.create(postToCreate)
        try {
          if (!remoteUser.banned && !remoteUserServerBaned && fediEmojis) {
            processEmojis(newPost, fediEmojis)
          }
        } catch (error) {
          logger.debug('Problem processing emojis')
        }
        newPost.setMedias(medias)
        try {
          if (postPetition.quoteUrl) {
            const postToQuote = await getPostThreadRecursive(user, postPetition.quoteUrl)
            if (postToQuote && postToQuote.privacy != Privacy.DirectMessage) {
              quotes.push(postToQuote)
            }
            if (!postToQuote) {
              postToCreate.content = postToCreate.content + `<p>RE: ${postPetition.quoteUrl}</p>`
            }
            const postsToQuotePromise: any[] = []
            postPetition.tag
              ?.filter((elem: fediverseTag) => elem.type === 'Link')
              .forEach((quote: fediverseTag) => {
                postsToQuotePromise.push(getPostThreadRecursive(user, quote.href as string))
                postToCreate.content = postToCreate.content.replace(quote.name, '')
              })
            const quotesToAdd = await Promise.allSettled(postsToQuotePromise)
            const quotesThatWillGetAdded = quotesToAdd.filter(
              (elem) => elem.status === 'fulfilled' && elem.value && elem.value.privacy !== 10
            )
            quotesThatWillGetAdded.forEach((quot) => {
              if (quot.status === 'fulfilled' && !quotes.map((q) => q.id).includes(quot.value.id)) {
                quotes.push(quot.value)
              }
            })
          }
        } catch (error) {
          logger.info('Error processing quotes')
          logger.debug(error)
        }
        newPost.setQuoted(quotes)

        await newPost.save()

        await bulkCreateNotifications(
          quotes.map((quote) => ({
            notificationType: 'QUOTE',
            notifiedUserId: quote.userId,
            userId: newPost.userId,
            postId: newPost.id,
            createdAt: new Date(newPost.createdAt)
          })),
          {
            postContent: newPost.content,
            userUrl: remoteUser.url
          }
        )
        try {
          if (!remoteUser.banned && !remoteUserServerBaned) {
            await addTagsToPost(newPost, fediTags)
          }
        } catch (error) {
          logger.info('problem processing tags')
        }
        if (mentionedUsersIds.length != 0) {
          await processMentions(newPost, mentionedUsersIds)
        }
        await loadPoll(remotePostObject, newPost, user)
        const postCleanContent = dompurify.sanitize(newPost.content, { ALLOWED_TAGS: [] }).trim()
        const mentions = await newPost.getMentionPost()
        if (postCleanContent.startsWith('!ask') && mentions.length === 1) {
          let askContent = postCleanContent.split(`!ask @${mentions[0].url}`)[1]
          if (askContent.startsWith('@' + completeEnvironment.instanceUrl)) {
            askContent = askContent.split('@' + completeEnvironment.instanceUrl)[1]
          }
          await Ask.create({
            question: askContent,
            userAsker: newPost.userId,
            userAsked: mentions[0].id,
            answered: false,
            apObject: JSON.stringify(postPetition)
          })
        }
        return newPost
      }
    } catch (error) {
      logger.trace({
        message: 'error getting remote post',
        url: remotePostId,
        user: user.url,
        problem: error
      })
      return null
    }
  }
}

async function addTagsToPost(post: any, originalTags: fediverseTag[]) {
  let tags = [...originalTags]
  const res = await post.setPostTags([])
  if (tags.some((elem) => elem.name == 'WafrnHashtag')) {
    tags = tags.filter((elem) => elem.name == 'WafrnHashtag')
  }
  return await PostTag.bulkCreate(
    tags
      .filter((elem) => elem && post && elem.name && post.id)
      .map((elem) => {
        return {
          tagName: elem?.name?.replace('#', ''),
          postId: post.id
        }
      })
  )
}

async function processMentions(post: any, userIds: string[]) {
  await post.setMentionPost([])
  await Notification.destroy({
    where: {
      notificationType: 'MENTION',
      postId: post.id
    }
  })
  const blocks = await Blocks.findAll({
    where: {
      blockerId: {
        [Op.in]: userIds
      },
      blockedId: post.userId
    }
  })
  const remoteUser = await User.findByPk(post.userId, { attributes: ['url', 'federatedHostId'] })
  const userServerBlocks = await ServerBlock.findAll({
    where: {
      userBlockerId: {
        [Op.in]: userIds
      },
      blockedServerId: remoteUser?.federatedHostId || ''
    }
  })
  const blockerIds: string[] = blocks
    .map((block: any) => block.blockerId)
    .concat(userServerBlocks.map((elem: any) => elem.userBlockerId))

  await bulkCreateNotifications(
    userIds.map((mentionedUserId) => ({
      notificationType: 'MENTION',
      notifiedUserId: mentionedUserId,
      userId: post.userId,
      postId: post.id,
      createdAt: new Date(post.createdAt)
    })),
    {
      postContent: post.content,
      userUrl: remoteUser?.url
    }
  )

  return await PostMentionsUserRelation.bulkCreate(
    userIds
      .filter((elem) => !blockerIds.includes(elem))
      .map((elem) => {
        return {
          postId: post.id,
          userId: elem
        }
      }),
    {
      ignoreDuplicates: true
    }
  )
}

async function processEmojis(post: any, fediEmojis: any[]) {
  let emojis: any[] = []
  let res: any
  const emojiIds: string[] = Array.from(new Set(fediEmojis.map((emoji: any) => emoji.id)))
  const foundEmojis = await Emoji.findAll({
    where: {
      id: {
        [Op.in]: emojiIds
      }
    }
  })
  foundEmojis.forEach((emoji: any) => {
    const newData = fediEmojis.find((foundEmoji: any) => foundEmoji.id === emoji.id)
    if (newData && newData.icon?.url) {
      emoji.set({
        url: newData.icon.url
      })
      emoji.save()
    } else {
      logger.debug('issue with emoji')
      logger.debug(emoji)
      logger.debug(newData)
    }
  })
  emojis = emojis.concat(foundEmojis)
  const notFoundEmojis = fediEmojis.filter((elem: any) => !foundEmojis.find((found: any) => found.id === elem.id))
  if (fediEmojis && notFoundEmojis && notFoundEmojis.length > 0) {
    try {
      const newEmojis = notFoundEmojis.map((newEmoji: any) => {
        return {
          id: newEmoji.id ? newEmoji.id : newEmoji.name + newEmoji.icon?.url,
          name: newEmoji.name,
          external: true,
          url: newEmoji.icon?.url
        }
      })
      emojis = emojis.concat(await Emoji.bulkCreate(newEmojis, { ignoreDuplicates: true }))
    } catch (error) {
      logger.debug('Error with emojis')
      logger.debug(error)
    }
  }

  return await post.setEmojis(emojis)
}

export { getPostThreadRecursive }

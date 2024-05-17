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
  sequelize
} from '../../db'
import { environment } from '../../environment'
import { logger } from '../logger'
import { getRemoteActor } from './getRemoteActor'
import { getPetitionSigned } from './getPetitionSigned'
import { fediverseTag } from '../../interfaces/fediverse/tags'
import { loadPoll } from './loadPollFromPost'
async function getPostThreadRecursive(
  user: any,
  remotePostId: string,
  remotePostObject?: any,
  localPostToForceUpdate?: string
) {
  try {
    remotePostId.startsWith(`${environment.frontendUrl}/fediverse/post/`)
  } catch (error) {
    logger.debug('HERE IS THE ISSUE')
    logger.debug(remotePostId)
  }
  if (remotePostId.startsWith(`${environment.frontendUrl}/fediverse/post/`)) {
    // we are looking at a local post
    const partToRemove = `${environment.frontendUrl}/fediverse/post/`
    const postId = remotePostId.substring(partToRemove.length)
    return await Post.findOne({
      where: {
        id: postId
      }
    })
  }
  const postInDatabase = await Post.findOne({
    where: {
      remotePostId: remotePostId
    }
  })
  if (postInDatabase && !localPostToForceUpdate) {
    const parentPostPetition = await getPetitionSigned(user, postInDatabase.remotePostId)
    if (parentPostPetition) {
      await loadPoll(parentPostPetition, postInDatabase, user)
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
          const parentPostPetition = await getPetitionSigned(user, remotePostInDatabase.remotePostId)
          if (parentPostPetition) {
            await loadPoll(parentPostPetition, remotePostInDatabase, user)
          }
          return remotePostInDatabase
        }
      }
      const remoteUser = await getRemoteActor(postPetition.attributedTo, user)
      const remoteUserServerBaned = remoteUser.federatedHostId
        ? (await FederatedHost.findByPk(remoteUser.federatedHostId)).blocked
        : false
      const medias: any[] = []
      const fediTags: fediverseTag[] = [
        ...new Set<fediverseTag>(
          postPetition.tag
            ?.filter((elem: fediverseTag) => elem.type === 'Hashtag')
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

      let privacy = 10
      if (postPetition.to.includes('https://www.w3.org/ns/activitystreams#Public')) {
        // post is PUBLIC
        privacy = 0
      }
      if (postPetition.cc.includes('https://www.w3.org/ns/activitystreams#Public')) {
        // unlisted
        privacy = 3
      }
      if (postPetition.to[0].toString().indexOf('followers') !== -1) {
        privacy = 1
      }

      let postTextContent = '' + postPetition.content
      if (postPetition.attachment && postPetition.attachment.length > 0 && !remoteUser.banned) {
        for await (const remoteFile of postPetition.attachment) {
          if (remoteFile.type !== 'Link') {
            const wafrnMedia = await Media.create({
              url: remoteFile.url,
              NSFW: postPetition?.sensitive,
              adultContent: !!postPetition?.sensitive,
              userId: remoteUser.id,
              description: remoteFile.name,
              ipUpload: 'IMAGE_FROM_OTHER_FEDIVERSE_INSTANCE',
              order: postPetition.attachment.indexOf(remoteFile), // could be non consecutive but its ok
              external: true
            })
            medias.push(wafrnMedia)
          } else {
            postTextContent = '' + postTextContent + `<a href="${remoteFile.href}" >${remoteFile.href}</a>`
          }
        }
      }

      const lemmyName = postPetition.name ? postPetition.name : ''
      postTextContent = postTextContent ? postTextContent : `<p>${lemmyName}</p>`
      const postToCreate: any = {
        content: '' + postTextContent,
        content_warning: postPetition.summary
          ? postPetition.summary
          : remoteUser.NSFW
          ? 'User is marked as NSFW by this instance staff. Possible NSFW without tagging'
          : '',
        createdAt: new Date(postPetition.published),
        updatedAt: new Date(),
        userId: remoteUser.id,
        remotePostId: postPetition.id,
        privacy: privacy
      }

      const mentionedUsersIds: string[] = []
      const tagsToAdd: any = []
      const emojis: any[] = []
      const quotes: any[] = []
      try {
        if (!remoteUser.banned && !remoteUserServerBaned) {
          for await (const mention of fediMentions) {
            let mentionedUser
            if (mention.href?.indexOf(environment.frontendUrl) !== -1) {
              const username = mention.href?.substring(`${environment.frontendUrl}/fediverse/blog/`.length) as string
              mentionedUser = await User.findOne({
                where: {
                  [Op.or]: [
                    sequelize.where(
                      sequelize.fn('LOWER', sequelize.col('url')),
                      'LIKE',
                      // TODO fix
                      username.toLowerCase()
                    )
                  ]
                }
              })
            } else {
              mentionedUser = await getRemoteActor(mention.href, user)
            }
            if (mentionedUser?.id) {
              mentionedUsersIds.push(mentionedUser.id)
            }
          }
        }
      } catch (error) {
        logger.info('problem processing mentions')
        logger.info(error)
      }
      try {
        if (postPetition.quoteUrl) {
          const postToQuote = await getPostThreadRecursive(user, postPetition.quoteUrl)
          if (postToQuote && postToQuote.privacy != 10) {
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
      if (postPetition.inReplyTo) {
        const parent = await getPostThreadRecursive(user, postPetition.inReplyTo)
        postToCreate.parentId = parent?.id
      }

      const existingPost = localPostToForceUpdate ? await Post.findByPk(localPostToForceUpdate) : undefined

      if (existingPost) {
        existingPost.update(postToCreate)
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
      newPost.setQuoted(quotes)
      await newPost.save()
      try {
        if (!remoteUser.banned && !remoteUserServerBaned) {
          await addTagsToPost(newPost, fediTags)
        }
      } catch (error) {
        logger.info('problem processing tags')
      }
      await processMentions(newPost, mentionedUsersIds)
      await loadPoll(remotePostObject, newPost, user)
      return newPost
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

async function addTagsToPost(post: any, tags: fediverseTag[]) {
  const res = await post.setPostTags([])
  return await PostTag.bulkCreate(
    tags.map((elem) => {
      if (elem.name) {
        return {
          tagName: elem.name.replace('#', ''),
          postId: post.id
        }
      }
    })
  )
}

async function processMentions(post: any, userIds: string[]) {
  await post.setMentionPost([])
  const blocks = await Blocks.findAll({
    where: {
      blockerId: {
        [Op.in]: userIds
      },
      blockedId: post.userId
    }
  })
  const remoteUser = await User.findByPk(post.userId, { attributes: ['federatedHostId'] })
  const userServerBlocks = await ServerBlock.findAll({
    where: {
      userBlockerId: {
        [Op.in]: userIds
      },
      blockedServerId: remoteUser.federatedHostId
    }
  })
  const blockerIds: string[] = blocks
    .map((block: any) => block.blockerId)
    .concat(userServerBlocks.map((elem: any) => elem.userBlockerId))

  return await PostMentionsUserRelation.bulkCreate(
    userIds
      .filter((elem) => !blockerIds.includes(elem))
      .map((elem) => {
        return {
          postId: post.id,
          userId: elem
        }
      })
  )
}

async function processEmojis(post: any, fediEmojis: any[]) {
  let emojis: any[] = []
  let res: any
  const emojiIds: string[] = fediEmojis.map((emoji: any) => emoji.id)
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
      emoji.update({
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
          id: newEmoji.id,
          name: newEmoji.name,
          external: true,
          url: newEmoji.icon.url
        }
      })
      emojis = emojis.concat(await Emoji.bulkCreate(newEmojis))
    } catch (error) {
      logger.debug('Error with emojis')
      logger.debug(error)
    }
  }

  return post.setEmojis(emojis)
}

export { getPostThreadRecursive }

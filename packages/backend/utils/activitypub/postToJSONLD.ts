import { Op } from 'sequelize'
import { Media, Post, PostTag, sequelize, User } from '../../models/index.js'
import { completeEnvironment } from '../backendOptions.js'
import { fediverseTag } from '../../interfaces/fediverse/tags.js'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { emojiToAPTag } from './emojiToAPTag.js'
import { getPostReplies } from './getPostReplies.js'
import { getPostAndUserFromPostId } from '../cacheGetters/getPostAndUserFromPostId.js'
import { logger } from '../logger.js'
import { Privacy } from '../../models/post.js'
import { redisCache } from '../redis.js'

async function postToJSONLD(postId: string): Promise<activityPubObject | undefined> {
  let resFromCacheString = await redisCache.get('postToJsonLD:' + postId)
  if (resFromCacheString) {
    return JSON.parse(resFromCacheString) as activityPubObject
  }
  const cacheData = await getPostAndUserFromPostId(postId)
  const post = cacheData.data
  const localUser = post.user
  const userAsker = post.ask?.asker
  const ask = post.ask

  const stringMyFollowers = `${completeEnvironment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}/followers`
  const dbMentions = post.mentionPost
  let mentionedUsers: string[] = []

  if (dbMentions) {
    mentionedUsers = dbMentions.filter((elem: any) => elem.remoteInbox).map((elem: any) => elem.remoteId)
  }
  let parentPostString = null
  let quotedPostString = null
  const conversationString = `${completeEnvironment.frontendUrl}/fediverse/conversation/${post.id}`

  if (post.parentId) {
    let dbPost = (await getPostAndUserFromPostId(post.parentId)).data
    if (post.bskyDid) {
      // we do same check for all parents
      const ancestorIdsQuery = await sequelize.query(
        `SELECT "ancestorId" FROM "postsancestors" where "postsId" = '${post.parentId}'`
      )
      const ancestorIds: string[] = ancestorIdsQuery[0].map((elem: any) => elem.ancestorId)
      if (ancestorIds.length > 0) {
        const ancestors = await Post.findAll({
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['url']
            }
          ],
          where: {
            id: {
              [Op.in]: ancestorIds
            }
          }
        })
        const parentsUserUrls = ancestors.map((elem) => elem.user.url)
        if (parentsUserUrls.some((elem) => elem.split('@').length == 2)) {
          return undefined
        }
      }
    }
    while (
      dbPost &&
      dbPost.content === '' &&
      dbPost.hierarchyLevel !== 0 &&
      dbPost.postTags.length == 0 &&
      dbPost.medias.length == 0 &&
      dbPost.quoted.length == 0 && // fix this this is still dirty
      dbPost.content_warning.length == 0
    ) {
      // TODO optimize this
      const tmpPost = (await getPostAndUserFromPostId(post.parentId)).data
      dbPost = tmpPost
    }
    parentPostString = dbPost?.remotePostId
      ? dbPost.remotePostId
      : `${completeEnvironment.frontendUrl}/fediverse/post/${dbPost ? dbPost.id : post.parentId}`
  }
  const postMedias = await post.medias
  let processedContent = post.content
  const wafrnMediaRegex =
    /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm

  // we remove the wafrnmedia from the post for the outside world, as they get this on the attachments
  processedContent = processedContent.replaceAll(wafrnMediaRegex, '')
  if (ask) {
    processedContent = `<p>${getUserName(userAsker)} asked </p> <blockquote>${
      ask.question
    }</blockquote> ${processedContent} <p>To properly see this ask, <a href="${
      completeEnvironment.frontendUrl + '/fediverse/post/' + post.id
    }">check the post in the original instance</a></p>`
  }
  const mentions: string[] = post.mentionPost.map((elem: any) => elem.id)
  const fediMentions: fediverseTag[] = []
  const fediTags: fediverseTag[] = []
  let tagsAndQuotes = '<br>'
  const quotedPosts = post.quoted
  if (quotedPosts && quotedPosts.length > 0) {
    const mainQuotedPost = quotedPosts[0]
    quotedPostString = getPostUrlForQuote(mainQuotedPost)
    quotedPosts.forEach((quotedPost: any) => {
      const postUrl = getPostUrlForQuote(quotedPost)
      tagsAndQuotes = tagsAndQuotes + `<br>RE: <a href="${postUrl}">${postUrl}</a><br>`
      if (!postUrl.startsWith('https://bsky.app/')) {
        fediTags.push({
          type: 'Link',
          name: `RE: ${postUrl}`,
          href: postUrl
        })
      }
    })
  }
  for await (const tag of post.postTags) {
    const externalTagName = tag.tagName.replaceAll('"', "'").replaceAll(' ', '-')
    const link = `${completeEnvironment.frontendUrl}/dashboard/search/${encodeURIComponent(tag.tagName)}`
    tagsAndQuotes = `${tagsAndQuotes}  <a class="hashtag" data-tag="post" href="${link}" rel="tag ugc">#${externalTagName}</a>`
    fediTags.push({
      type: 'Hashtag',
      name: `#${externalTagName}`,
      href: link
    })
    fediTags.push({
      type: 'WafrnHashtag',
      href: link,
      name: tag.tagName.replaceAll('"', "'")
    })
  }
  for await (const userId of mentions) {
    const user =
      (await User.findOne({ where: { id: userId } })) ||
      ((await User.findOne({ where: { url: completeEnvironment.deletedUser } })) as User)
    const url = user.url.startsWith('@') ? user.url : `@${user.url}@${completeEnvironment.instanceUrl}`
    const remoteId = user.url.startsWith('@')
      ? user.remoteId
      : `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url}`
    if (remoteId) {
      fediMentions.push({
        type: 'Mention',
        name: url,
        href: remoteId
      })
    }
  }

  let contentWarning = false
  postMedias.forEach((media: any) => {
    if (media.NSFW) {
      contentWarning = true
    }
  })

  const emojis = post.emojis

  if (ask) {
    fediTags.push({
      type: 'AskQuestion',
      name: ask.question,
      actor: userAsker
        ? userAsker.remoteId
          ? userAsker.remoteId
          : completeEnvironment.frontendUrl + '/fediverse/blog/' + userAsker.url
        : 'anonymous'
    })
  }

  const lineBreaksAtEndRegex = /\s*(<br\s*\/?>)+\s*$/g

  const usersToSend = getToAndCC(post.privacy, mentionedUsers, stringMyFollowers)
  const actorUrl = `${completeEnvironment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`
  let misskeyQuoteURL = quotedPostString
  if (misskeyQuoteURL?.startsWith('https://bsky.app/')) {
    misskeyQuoteURL = null
  }
  let postAsJSONLD: activityPubObject = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      `${completeEnvironment.frontendUrl}/contexts/litepub-0.1.jsonld`
    ],
    id: `${completeEnvironment.frontendUrl}/fediverse/activity/post/${post.id}`,
    type: 'Create',
    actor: actorUrl,
    published: new Date(post.createdAt).toISOString(),
    to: usersToSend.to,
    cc: usersToSend.cc,
    object: {
      id: `${completeEnvironment.frontendUrl}/fediverse/post/${post.id}`,
      actor: actorUrl,
      type: 'Note',
      summary: post.content_warning ? post.content_warning : '',
      inReplyTo: parentPostString,
      published: new Date(post.createdAt).toISOString(),
      updated: new Date(post.updatedAt).toISOString(),
      url: `${completeEnvironment.frontendUrl}/fediverse/post/${post.id}`,
      attributedTo: `${completeEnvironment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`,
      to: usersToSend.to,
      cc: usersToSend.cc,
      sensitive: !!post.content_warning || contentWarning,
      atomUri: `${completeEnvironment.frontendUrl}/fediverse/post/${post.id}`,
      inReplyToAtomUri: parentPostString,
      quoteUrl: misskeyQuoteURL,
      _misksey_quote: misskeyQuoteURL,
      quoteUri: misskeyQuoteURL,
      // conversation: conversationString,
      content: (processedContent + tagsAndQuotes).replace(lineBreaksAtEndRegex, ''),
      attachment: postMedias
        ?.sort((a: Media, b: Media) => a.mediaOrder - b.mediaOrder)
        .map((media: Media) => {
          const extension = media.url.split('.')[media.url.split('.').length - 1].toLowerCase()
          return {
            type: 'Document',
            mediaType: media.mediaType,
            url: media.external ? media.url : completeEnvironment.mediaUrl + media.url,
            sensitive: media.NSFW ? true : false,
            name: media.description
          }
        }),
      tag: fediMentions.concat(fediTags).concat(emojis.map((emoji: any) => emojiToAPTag(emoji))),
      replies: {
        id: `${completeEnvironment.frontendUrl}/fediverse/post/${post.id}/replies`,
        type: 'Collection',
        first: {
          type: 'CollectionPage',
          partOf: `${completeEnvironment.frontendUrl}/fediverse/post/${post.id}/replies`,
          next: `${completeEnvironment.frontendUrl}/fediverse/post/${post.id}/replies?page=1`,
          items: []
        }
      }
    }
  }
  const newObject: any = {}
  const objKeys = Object.keys(postAsJSONLD.object)
  objKeys.forEach((key) => {
    if (postAsJSONLD.object[key]) {
      newObject[key] = postAsJSONLD.object[key]
    }
  })
  postAsJSONLD.object = newObject
  if (
    post.content === '' &&
    post.postTags.length === 0 &&
    post.medias.length === 0 &&
    post.quoted.length === 0 &&
    post.content_warning == 0
  ) {
    postAsJSONLD = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${completeEnvironment.frontendUrl}/fediverse/post/${post.id}`,
      type: 'Announce',
      actor: `${completeEnvironment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`,
      published: new Date(post.createdAt).toISOString(),
      to:
        post.privacy / 1 === Privacy.DirectMessage
          ? mentionedUsers
          : post.privacy / 1 === Privacy.Public
          ? ['https://www.w3.org/ns/activitystreams#Public']
          : [stringMyFollowers],
      cc: [`${completeEnvironment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`, stringMyFollowers],
      object: parentPostString
    }
  }
  await redisCache.set('postToJsonLD:' + postId, JSON.stringify(postAsJSONLD), 'EX', 300)
  return postAsJSONLD
}

function getToAndCC(
  privacy: number,
  mentionedUsers: string[],
  stringMyFollowers: string
): { to: string[]; cc: string[] } {
  let to: string[] = []
  let cc: string[] = []
  switch (privacy) {
    case 0: {
      to = ['https://www.w3.org/ns/activitystreams#Public', stringMyFollowers, ...mentionedUsers]
      cc = mentionedUsers
      break
    }
    case 1: {
      to = [stringMyFollowers, ...mentionedUsers]
      cc = []
      break
    }
    case 3: {
      to = [stringMyFollowers, ...mentionedUsers]
      cc = ['https://www.w3.org/ns/activitystreams#Public']
      break
    }
    default: {
      ;(to = mentionedUsers), (cc = [])
    }
  }
  return {
    to,
    cc
  }
}

// stolen I mean inspired by https://stackoverflow.com/questions/2970525/converting-a-string-with-spaces-into-camel-case
function camelize(str: string): string {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function (match, index) {
    if (+match === 0) return '' // or if (/\s+/.test(match)) for white spaces
    return index === 0 ? match.toLowerCase() : match.toUpperCase()
  })
}

function getUserName(user?: { url: string }): string {
  let res = user ? '@' + user.url + '@' + completeEnvironment.instanceUrl : 'anonymous'
  if (user?.url.startsWith('@')) {
    res = user.url
  }
  return res
}

function getPostUrlForQuote(post: any): string {
  const isPostFromBsky = !!post.bskyUri
  const isPostFromFedi = !!post.remotePostId
  let res = `${completeEnvironment.frontendUrl}/fediverse/post/${post.id}`
  if (isPostFromBsky && post.user.url.startsWith('@')) {
    const parts = post.bskyUri.split('/app.bsky.feed.post/')
    const userDid = parts[0].split('at://')[1]
    res = `https://bsky.app/profile/${userDid}/post/${parts[1]}`
  } else if (isPostFromFedi) {
    res = post.remotePostId
  }
  return res
}

export { postToJSONLD, getPostUrlForQuote }

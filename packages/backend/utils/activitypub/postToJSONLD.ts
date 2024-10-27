import { Op } from 'sequelize'
import { Media, Post, PostTag, User } from '../../db.js'
import { environment } from '../../environment.js'
import { fediverseTag } from '../../interfaces/fediverse/tags.js'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { emojiToAPTag } from './emojiToAPTag.js'
import { getPostReplies } from './getPostReplies.js'
import { getPostAndUserFromPostId } from '../cacheGetters/getPostAndUserFromPostId.js'
import { logger } from '../logger.js'

async function postToJSONLD(postId: string) {
  const cacheData = await getPostAndUserFromPostId(postId)
  const post = cacheData.data
  const localUser = post.user
  const userAsker = post.ask?.asker
  const ask = post.ask

  const stringMyFollowers = `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}/followers`
  const dbMentions = post.mentionPost
  let mentionedUsers: string[] = []

  if (dbMentions) {
    mentionedUsers = dbMentions.filter((elem: any) => elem.remoteInbox).map((elem: any) => elem.remoteId)
  }
  let parentPostString = null
  let quotedPostString = null
  const conversationString = `${environment.frontendUrl}/fediverse/conversation/${post.id}`

  if (post.parentId) {
    let dbPost = (await getPostAndUserFromPostId(post.parentId)).data
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
      : `${environment.frontendUrl}/fediverse/post/${dbPost ? dbPost.id : post.parentId}`
  }
  const postMedias = await post.medias
  let processedContent = post.content
  const wafrnMediaRegex =
    /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm

  // we remove the wafrnmedia from the post for the outside world, as they get this on the attachments
  processedContent = processedContent.replaceAll(wafrnMediaRegex, '')
  if (ask) {
    processedContent = `<p>${getUserName(userAsker)} asked </p> <blockquote>${ask.question
      }</blockquote> ${processedContent} <p>To properly see this ask, <a href="${environment.frontendUrl + '/fediverse/post/' + post.id
      }">check the post in the original instance</a></p>`
  }
  const mentions: string[] = post.mentionPost.map((elem: any) => elem.id)
  const fediMentions: fediverseTag[] = []
  const fediTags: fediverseTag[] = []
  let tagsAndQuotes = '<br>'
  const quotedPosts = post.quoted
  if (quotedPosts && quotedPosts.length > 0) {
    const mainQuotedPost = quotedPosts[0]
    quotedPostString = mainQuotedPost.remotePostId
      ? mainQuotedPost.remotePostId
      : `${environment.frontendUrl}/fediverse/post/${mainQuotedPost.id}`
    quotedPosts.forEach((quotedPost: any) => {
      const postUrl = quotedPost.remotePostId
        ? quotedPost.remotePostId
        : `${environment.frontendUrl}/fediverse/post/${quotedPost.id}`
      tagsAndQuotes = tagsAndQuotes + `<br>RE: <a href="${postUrl}">${postUrl}</a><br>`
      fediTags.push({
        type: 'Link',
        name: `RE: ${postUrl}`,
        href: postUrl
      })
    })
  }
  for await (const tag of post.postTags) {
    const externalTagName = tag.tagName.replaceAll('"', "'")
    const link = `${environment.frontendUrl}/dashboard/search/${encodeURIComponent(tag.tagName)}`
    tagsAndQuotes = `${tagsAndQuotes}  <a class="hashtag" data-tag="post" href="${link}" rel="tag ugc">#${camelize(
      externalTagName
    )}</a>`
    fediTags.push({
      type: 'Hashtag',
      name: `#${camelize(externalTagName)}`,
      href: link
    })
    fediTags.push({
      type: 'WafrnHashtag',
      name: externalTagName
    })
  }
  for await (const userId of mentions) {
    const user =
      (await User.findOne({ where: { id: userId } })) ||
      (await User.findOne({ where: { url: environment.deletedUser } }))
    const url = user.url.startsWith('@') ? user.url : `@${user.url}@${environment.instanceUrl}`
    const remoteId = user.url.startsWith('@') ? user.remoteId : `${environment.frontendUrl}/fediverse/blog/${user.url}`
    fediMentions.push({
      type: 'Mention',
      name: url,
      href: remoteId
    })
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
          : environment.frontendUrl + '/fediverse/blog/' + userAsker.url
        : 'anonymous'
    })
  }

  const lineBreaksAtEndRegex = /\s*(<br\s*\/?>)+\s*$/g

  const usersToSend = getToAndCC(post.privacy, mentionedUsers, stringMyFollowers)
  const actorUrl = `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`
  let postAsJSONLD: activityPubObject = {
    '@context': ['https://www.w3.org/ns/activitystreams', `${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
    id: `${environment.frontendUrl}/fediverse/activity/post/${post.id}`,
    type: 'Create',
    actor: actorUrl,
    published: new Date(post.createdAt).toISOString(),
    to: usersToSend.to,
    cc: usersToSend.cc,
    object: {
      id: `${environment.frontendUrl}/fediverse/post/${post.id}`,
      actor: actorUrl,
      type: 'Note',
      summary: post.content_warning ? post.content_warning : '',
      inReplyTo: parentPostString,
      published: new Date(post.createdAt).toISOString(),
      updated: new Date(post.updatedAt).toISOString(),
      url: `${environment.frontendUrl}/fediverse/post/${post.id}`,
      attributedTo: `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`,
      to: usersToSend.to,
      cc: usersToSend.cc,
      sensitive: !!post.content_warning || contentWarning,
      atomUri: `${environment.frontendUrl}/fediverse/post/${post.id}`,
      inReplyToAtomUri: parentPostString,
      quoteUrl: quotedPostString,
      _misksey_quote: quotedPostString,
      quoteUri: quotedPostString,
      // conversation: conversationString,
      content: (processedContent + tagsAndQuotes).replace(lineBreaksAtEndRegex, ''),
      attachment: postMedias
        ?.sort((a: any, b: any) => a.mediaOrder - b.mediaOrder)
        .map((media: any) => {
          const extension = media.url.split('.')[media.url.split('.').length - 1].toLowerCase()
          return {
            type: 'Document',
            mediaType: extension === 'mp4' ? 'video/mp4' : 'image/avif',
            url: environment.mediaUrl + media.url,
            sensitive: media.NSFW ? true : false,
            name: media.description
          }
        }),
      tag: fediMentions.concat(fediTags).concat(emojis.map((emoji: any) => emojiToAPTag(emoji))),
      replies: {
        id: `${environment.frontendUrl}/fediverse/post/${post.id}/replies`,
        type: 'Collection',
        first: {
          type: 'CollectionPage',
          partOf: `${environment.frontendUrl}/fediverse/post/${post.id}/replies`,
          items: await getPostReplies(post.id)
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
      id: `${environment.frontendUrl}/fediverse/post/${post.id}`,
      type: 'Announce',
      actor: `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`,
      published: new Date(post.createdAt).toISOString(),
      to:
        post.privacy / 1 === 10
          ? mentionedUsers
          : post.privacy / 1 === 0
            ? ['https://www.w3.org/ns/activitystreams#Public']
            : [stringMyFollowers],
      cc: [`${environment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`, stringMyFollowers],
      object: parentPostString
    }
  }
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
      ; (to = mentionedUsers), (cc = [])
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
  let res = user ? '@' + user.url + '@' + environment.instanceUrl : 'anonymous'
  if (user?.url.startsWith('@')) {
    res = user.url
  }
  return res
}

export { postToJSONLD }

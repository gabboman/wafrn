import { Op } from 'sequelize'
import { Post, User } from '../../db'
import { environment } from '../../environment'
import { fediverseTag } from '../../interfaces/fediverse/tags'
import { activityPubObject } from '../../interfaces/fediverse/activityPubObject'
import { emojiToAPTag } from './emojiToAPTag'

async function postToJSONLD(post: any) {
  const tmpUser = await User.findByPk(post.userId)
  const localUser = tmpUser
    ? tmpUser
    : await User.findOne({
        where: {
          url: environment.deletedUser
        }
      })
  const stringMyFollowers = `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}/followers`
  const dbMentions = await post.getMentionPost()
  let mentionedUsers: string[] = []

  if (dbMentions) {
    mentionedUsers = dbMentions.filter((elem: any) => elem.remoteInbox).map((elem: any) => elem.remoteId)
  }
  let parentPostString = null
  let quotedPostString = null
  const conversationString = `${environment.frontendUrl}/fediverse/conversation/${post.id}`
  if (post.parentId) {
    let dbPost = await Post.findOne({
      where: {
        id: post.parentId
      }
    })
    while (dbPost && dbPost.content === '' && dbPost.hierarchyLevel !== 0) {
      // TODO optimize this
      const tmpPost = await dbPost.getParent()
      dbPost = tmpPost
    }
    parentPostString = dbPost?.remotePostId
      ? dbPost.remotePostId
      : `${environment.frontendUrl}/fediverse/post/${dbPost ? dbPost.id : post.parentId}`
  }
  const postMedias = await post.getMedias()
  let processedContent = post.content
  const wafrnMediaRegex =
    /\[wafrnmediaid="[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}"\]/gm

  // we remove the wafrnmedia from the post for the outside world, as they get this on the attachments
  processedContent = processedContent.replaceAll(wafrnMediaRegex, '')
  const mentions: string[] = (await post.getMentionPost()).map((elem: any) => elem.id)
  const fediMentions: fediverseTag[] = []
  const fediTags: fediverseTag[] = []
  let tagsAndQuotes = '<br>'
  const quotedPosts = await post.getQuoted()
    if(quotedPosts && quotedPosts.length > 0) {
      const mainQuotedPost = quotedPosts[0]
      quotedPostString = mainQuotedPost.remotePostId ? mainQuotedPost.remotePostId : `${environment.frontendUrl}/fediverse/post/${mainQuotedPost.id}`
      quotedPosts.forEach((quotedPost: any) => {
        const postUrl = quotedPost.remotePostId ? quotedPost.remotePostId : `${environment.frontendUrl}/fediverse/post/${quotedPost.id}`
        tagsAndQuotes = tagsAndQuotes + `<p>RE: <a href="${postUrl}">${postUrl}</a></p>`
        fediTags.push({
          type: 'Link',
          name: `RE: ${postUrl}`,
          href: postUrl
        })
      })
    }
  for await (const tag of await post.getPostTags()) {
    const externalTagName = tag.tagName.replaceAll(' ', '-').replaceAll('"', "'")
    const link = `${environment.frontendUrl}/dashboard/search/${encodeURIComponent(tag.tagName)}`
    tagsAndQuotes = `${tagsAndQuotes}  <a class="hashtag" data-tag="post" href="${link}" rel="tag ugc">#${externalTagName}</a>`
    fediTags.push({
      type: 'Hashtag',
      name: `#${externalTagName}`,
      href: link
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

  const emojis = await post.getEmojis()


  const usersToSend = getToAndCC(post.privacy, mentionedUsers, stringMyFollowers)
  const actorUrl = `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`
  let postAsJSONLD: activityPubObject = {
    '@context': ['https://www.w3.org/ns/activitystreams', `${environment.frontendUrl}/contexts/litepub-0.1.jsonld`],
    id: `${environment.frontendUrl}/fediverse/activity/post/${post.id}`,
    type: 'Create',
    actor: actorUrl,
    published: post.createdAt.toISOString(),
    to: usersToSend.to,
    cc: usersToSend.cc,
    object: {
      id: `${environment.frontendUrl}/fediverse/post/${post.id}`,
      actor: actorUrl,
      type: 'Note',
      summary: post.content_warning ? post.content_warning : '',
      inReplyTo: parentPostString,
      published: post.createdAt.toISOString(),
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
      content: (processedContent + tagsAndQuotes).replaceAll('<br>', ''),
      attachment: postMedias
        ?.sort((a: any, b: any) => a.order - b.order)
        .map((media: any) => {
          const extension = media.url.split('.')[media.url.split('.').length - 1].toLowerCase()
          return {
            type: 'Document',
            mediaType: extension === 'mp4' ? 'video/mp4' : 'image/webp',
            url: environment.mediaUrl + media.url,
            sensitive: media.NSFW ? `Marked as NSFW: ${media.description}` : '',
            name: media.description
          }
        }),
      tag: fediMentions.concat(fediTags).concat(emojis.map((emoji: any) =>emojiToAPTag(emoji)))
      /*
      replies: {
        id: `${environment.frontendUrl}/fediverse/post/${post.id}/replies`,
        type: 'Collection',
        first: {
          type: 'CollectionPage',
          next: `${environment.frontendUrl}/fediverse/post/${post.id}/replies&page=true`,
          partOf: `${environment.frontendUrl}/fediverse/post/${post.id}/replies`,
          items: []
        }
      }
      */
    }
  }
  const newObject: any = {}
  const objKeys = Object.keys(postAsJSONLD.object);
  objKeys.forEach(key => {
    if(postAsJSONLD.object[key]) {
      newObject[key] = postAsJSONLD.object[key]
    }
  })
  postAsJSONLD.object = newObject
  if (post.content === '' && (await post.getPostTags()).length === 0 && (await post.getMedias()).length === 0) {
    postAsJSONLD = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${environment.frontendUrl}/fediverse/post/${post.id}`,
      type: 'Announce',
      actor: `${environment.frontendUrl}/fediverse/blog/${localUser.url.toLowerCase()}`,
      published: post.createdAt.toISOString(),
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
      ;(to = mentionedUsers), (cc = [])
    }
  }
  return {
    to,
    cc
  }
}

export { postToJSONLD }

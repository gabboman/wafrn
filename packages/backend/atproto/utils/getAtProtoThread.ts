// returns the post id
import { getAtProtoSession } from './getAtProtoSession.js'
import { QueryParams } from '@atproto/sync/dist/firehose/lexicons.js'
import { Media, Notification, Post, PostMentionsUserRelation, PostTag, Quotes, User } from '../../db.js'
import { environment } from '../../environment.js'
import { Model, Op } from 'sequelize'
import { PostView, ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs.js'
import { getAtprotoUser, forcePopulateUsers } from './getAtprotoUser.js'
import { CreateOrUpdateOp } from '@skyware/firehose'
import { getAllLocalUserIds } from '../../utils/cacheGetters/getAllLocalUserIds.js'
import { wait } from '../../utils/wait.js'
import { isArray } from 'underscore'
import { logger } from '../../utils/logger.js'
import { RichText } from '@atproto/api'
import showdown from 'showdown'
import { bulkCreateNotifications, createNotification } from '../../utils/pushNotifications.js'

const markdownConverter = new showdown.Converter({
  simplifiedAutoLink: true,
  literalMidWordUnderscores: true,
  strikethrough: true,
  simpleLineBreaks: true,
  openLinksInNewWindow: true,
  emoji: true
})

const adminUser = User.findOne({
  where: {
    url: environment.adminUser
  }
})
const agent = environment.enableBsky ? await getAtProtoSession((await adminUser) as Model<any, any>) : undefined

async function getAtProtoThread(
  uri: string,
  operation?: { operation: CreateOrUpdateOp; remoteUser: Model<any, any> },
  forceUpdate?: boolean
): Promise<string> {
  if (operation) {
    const postExisting = await Post.findOne({
      where: {
        bskyUri: uri
      }
    })
    if (postExisting) {
      return postExisting.id
    } else {
      const postObject: PostView = {
        record: operation.operation.record,
        cid: operation.operation.cid,
        uri: uri,
        labels: operation.operation.record.labels ? operation.operation.record.labels.values : [],
        indexedAt: new Date().toISOString(),
        author: {
          did: operation.remoteUser.bskyDid,
          handle: operation.remoteUser.url.split('@')[1],
          displayName: operation.remoteUser.name
        }
      }
      if (postObject.record.reply) {
        const parentFound = await Post.findOne({
          where: {
            bskyUri: postObject.record.reply.parent.uri
          }
        })
        if (parentFound) {
          return (await processSinglePost(postObject, parentFound.id)) as string
        } else {
          const parentThread: ThreadViewPost = (
            await agent.getPostThread({ uri: postObject.record.reply.parent.uri, depth: 0, parentHeight: 1000 })
          ).data.thread as ThreadViewPost
          //const dids = getDidsFromThread(parentThread)
          //await forcePopulateUsers(dids, (await adminUser) as Model<any, any>)
          const parentId = (await processParents(parentThread as ThreadViewPost)) as string
          return (await processSinglePost(postObject, parentId, forceUpdate)) as string
        }
      } else {
        return (await processSinglePost(postObject, undefined, forceUpdate)) as string
      }
    }
  }

  // TODO optimize this a bit if post is not in reply to anything that we dont have
  const thread: ThreadViewPost = (await agent.getPostThread({ uri: uri, depth: 50, parentHeight: 1000 })).data
    .thread as ThreadViewPost
  //const tmpDids = getDidsFromThread(thread)
  //forcePopulateUsers(tmpDids, (await adminUser) as Model<any, any>)
  let parentId: string | undefined = undefined
  if (thread.parent) {
    parentId = (await processParents(thread.parent as ThreadViewPost)) as string
  }
  const procesedPost = await processSinglePost(thread.post, parentId, forceUpdate)
  if (thread.replies && procesedPost) {
    for await (const repliesThread of thread.replies) {
      processReplies(repliesThread, procesedPost)
    }
  }
  return procesedPost as string
}

async function processReplies(thread: ThreadViewPost, parentId: string) {
  const post = await processSinglePost(thread.post, parentId)
  if (thread.replies && post) {
    for await (const repliesThread of thread.replies) {
      processReplies(repliesThread, post)
    }
  }
}

async function processParents(thread: ThreadViewPost): Promise<string | undefined> {
  let parentId: string | undefined = undefined
  if (thread.parent) {
    parentId = await processParents(thread.parent as ThreadViewPost)
  }
  return await processSinglePost(thread.post, parentId)
}

async function processSinglePost(
  post: PostView,
  parentId?: string,
  forceUpdate?: boolean
): Promise<string | undefined> {
  if (!post) {
    throw new Error('Post is undefined and should not be undefined')
  }
  if (!forceUpdate) {
    const existingPost = await Post.findOne({
      where: {
        bskyUri: post.uri
      }
    })
    if (existingPost) {
      return existingPost.id
    }
  }
  const postCreator = await getAtprotoUser(post.author.did, (await adminUser) as Model<any, any>, post.author)
  if (!postCreator || !post) {
    const usr = postCreator
      ? postCreator
      : ((await User.findOne({ where: { url: environment.deletedUser } })) as Model<any, any>)
    const invalidPost = await Post.create({
      userId: usr.id,
      content: `Failed to get atproto post`,
      parentId: parentId
    })
    return invalidPost.id
  }
  if (postCreator) {
    const medias = getPostMedias(post)
    let tags: string[] = []
    let mentions: string[] = []
    let postText = post.record.text
    if (post.record.facets && post.record.facets.length > 0 && agent) {
      const rt = new RichText({
        text: postText
      })
      await rt.detectFacets(agent)
      let text = ''
      for (const segment of rt.segments()) {
        if (segment.isLink()) {
          text += `<a href="${segment.link?.uri}" target="_blank">${segment.text}</a>`
        } else if (segment.isMention()) {
          text += `<a href="${environment.frontendUrl}/blog/${segment.mention?.did}" target="_blank">${segment.text}</a>`
        } else if (segment.isTag()) {
          text += `<a href="${environment.frontendUrl}/search/${segment.text}" target="_blank">${segment.text}</a>`
        } else {
          text += segment.text
        }
      }
      postText = text
    }
    postText = postText.replaceAll('\n', '<br>')
    const newData = {
      userId: postCreator.id,
      bskyCid: post.cid,
      bskyUri: post.uri,
      content: postText,
      createdAt: new Date(post.record.createdAt),
      privacy: 0,
      parentId: parentId,
      content_warning: getPostLabels(post)
    }
    if (!parentId) {
      delete newData.parentId
    }
    let postToProcess = await Post.findOne({
      where: { userId: postCreator.id, bskyCid: post.cid, bskyUri: post.uri }
    })
    if (!postToProcess) {
      postToProcess = await Post.create(newData)
      if (medias) {
        await Media.bulkCreate(
          medias.map((media: any) => {
            return { ...media, postId: postToProcess.id }
          })
        )
      }
    }
    if (parentId) {
      const ancestors = await postToProcess.getAncestors({
        attributes: ['userId'],
        where: {
          hierarchyLevel: {
            [Op.gt]: postToProcess.hierarchyLevel - 5
          }
        }
      })
      mentions = mentions.concat(ancestors.map((elem) => elem.userId))
    }
    mentions = [...new Set(mentions)]
    if (mentions.length > 0) {
      await Notification.destroy({
        where: {
          notificationType: 'MENTION',
          postId: postToProcess.id
        }
      })
      await PostMentionsUserRelation.destroy({
        where: {
          postId: postToProcess.id
        }
      })
      await bulkCreateNotifications(
        mentions.map((mnt) => ({
          notificationType: 'MENTION',
          postId: postToProcess.id,
          notifiedUserId: mnt,
          userId: postToProcess.userId
        })),
        {
          ignoreDuplicates: true,
          postContent: postText,
          userUrl: postCreator.url
        }
      )
      await PostMentionsUserRelation.bulkCreate(
        mentions.map((mnt) => {
          return {
            userId: mnt,
            postId: postToProcess.id
          }
        }),
        { ignoreDuplicates: true }
      )
    }
    if (tags.length > 0) {
      await PostTag.destroy({
        where: {
          postId: postToProcess.id
        }
      })
      await PostTag.bulkCreate(
        tags.map((tag) => {
          return {
            postId: postToProcess.id,
            tagName: tag
          }
        })
      )
    }
    const quotedPostUri = getQuotedPostUri(post)
    if (quotedPostUri) {
      const quotedPostId = await getAtProtoThread(quotedPostUri)
      const quotedPost = (await Post.findByPk(quotedPostId)) as Model<any, any>
      await createNotification(
        {
          notificationType: 'QUOTE',
          notifiedUserId: quotedPost.userId,
          userId: postToProcess.userId,
          postId: postToProcess.id
        },
        {
          postContent: postToProcess.content,
          userUrl: posterUser?.url
        }
      )
      await Quotes.create({
        quoterPostId: postToProcess.id,
        quotedPostId: quotedPostId
      })
    }
    return postToProcess.id
  }
}

function getDidsFromThread(thread: ThreadViewPost): string[] {
  let res: string[] = []
  res.push(thread.post.author.did)
  if (thread.replies) {
    for (const reply of thread.replies) {
      res = res.concat(getRepliesDidRecursive(reply as ThreadViewPost, res))
    }
  }

  if (thread.parent) {
    let parent: ThreadViewPost | undefined = thread.parent as ThreadViewPost
    while (parent) {
      res.push(parent.post.author.did)
      parent = parent.parent as ThreadViewPost | undefined
    }
  }

  res = [...new Set(res)]
  return res
}

function getRepliesDidRecursive(thread: ThreadViewPost, dids: string[]): string[] {
  let res: string[] = [...dids]
  res.push(thread.post.author.did)
  if (thread.replies) {
    for (const reply of thread.replies) {
      res = res.concat(getRepliesDidRecursive(reply as ThreadViewPost, res))
    }
  }
  return res
}

function getPostMedias(post: PostView) {
  let res = []
  const embed = post.record.embed
  if (embed) {
    if (embed.external) {
      res = res.concat([
        {
          mediaType: embed.external.thumb?.mimeType,
          description: embed.external.title,
          url: embed.external.uri,
          mediaOrder: 0,
          external: true
        }
      ])
    }
    if (embed.images || embed.media) {
      const thingToProcess = embed.images ? embed.images : embed.media.images
      if (thingToProcess) {
        const toConcat = thingToProcess.map((media, index) => {
          const cid = media.image.ref['$link'] ? media.image.ref['$link'] : media.image.ref.toString()
          const did = post.author.did
          return {
            mediaType: media.image.mimeType,
            description: media.alt,
            height: media.aspectRatio?.height,
            width: media.aspectRatio?.width,
            url: `?cid=${encodeURIComponent(cid)}&did=${encodeURIComponent(did)}`,
            mediaOrder: index,
            external: true
          }
        })
        res = res.concat(toConcat)
      } else {
        logger.debug({
          message: `Bsky problem getting medias on post ${post.uri}`
        })
      }
    }
    if (embed.video) {
      const video = embed.video
      const cid = video.ref['$link'] ? video.ref['$link'] : video.ref.toString()
      const did = post.author.did
      res = res.concat([
        {
          mediaType: embed.video.mimeType,
          description: '',
          height: embed.aspectRatio?.height,
          width: embed.aspectRatio?.width,
          url: `?cid=${encodeURIComponent(cid)}&did=${encodeURIComponent(did)}`,
          mediaOrder: 0,
          external: true
        }
      ])
    }
  }
  return res
}

function getQuotedPostUri(post: PostView): string | undefined {
  let res: string | undefined = undefined
  const embed = post.record.embed
  if (embed && ['app.bsky.embed.record', 'app.bsky.embed.recordWithMedia'].includes(embed['$type'])) {
    res = embed.record.uri
  }
  return res
}

// TODO improve this so we get better nsfw messages lol
function getPostLabels(post: PostView): string {
  let res = ''
  if (post.labels && post.labels.length > 0) {
    res = 'Post is labeled as NSFW:'
  }
  return res
}

export { getAtProtoThread }

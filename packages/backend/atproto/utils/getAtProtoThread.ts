// returns the post id
import { getAtProtoSession } from './getAtProtoSession.js'
import { QueryParams } from '@atproto/sync/dist/firehose/lexicons.js'
import { Media, Notification, Post, PostMentionsUserRelation, PostTag, Quotes, User } from '../../models/index.js'
import { Model, Op } from 'sequelize'
import { PostView, ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs.js'
import { getAtprotoUser, forcePopulateUsers } from './getAtprotoUser.js'
import { CreateOrUpdateOp } from '@skyware/firehose'
import { logger } from '../../utils/logger.js'
import { RichText } from '@atproto/api'
import showdown from 'showdown'
import { bulkCreateNotifications, createNotification } from '../../utils/pushNotifications.js'
import { getAllLocalUserIds } from '../../utils/cacheGetters/getAllLocalUserIds.js'
import { Privacy } from '../../models/post.js'
import { wait } from '../../utils/wait.js'
import { UpdatedAt } from 'sequelize-typescript'
import { completeEnvironment } from '../../utils/backendOptions.js'

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
    url: completeEnvironment.adminUser
  }
})

async function getAtProtoThread(
  uri: string,
  operation?: { operation: CreateOrUpdateOp; remoteUser: User },
  forceUpdate?: boolean
): Promise<string | undefined> {
  if (operation) {
    const postExisting = await Post.findOne({
      where: {
        bskyUri: uri
      }
    })
    if (postExisting) {
      return postExisting.id
    } else {
      let record = operation.operation.record as any
      const postObject: PostView = {
        record: record,
        cid: operation.operation.cid,
        uri: uri,
        labels: record.labels ? record.labels.values : [],
        indexedAt: new Date().toISOString(),
        author: {
          did: operation.remoteUser.bskyDid as string,
          handle: operation.remoteUser.url.split('@')[1],
          displayName: operation.remoteUser.name
        }
      }
      if (operation.remoteUser.description == null) {
        // wait this user bio is empty
        await getAtprotoUser(operation.remoteUser.bskyDid as string, (await adminUser) as User)
      }
      if (record.reply) {
        const parentFound = await Post.findOne({
          where: {
            bskyUri: record.reply.parent.uri
          }
        })
        if (parentFound) {
          return (await processSinglePost(postObject, parentFound.id)) as string
        } else {
          const thread = await getPostThreadSafe({
            uri: record.reply.parent.uri,
            depth: 0,
            parentHeight: 1000
          })
          if (thread) {
            const parentThread: ThreadViewPost = thread.data.thread as ThreadViewPost
            //const dids = getDidsFromThread(parentThread)
            //await forcePopulateUsers(dids, (await adminUser) as Model<any, any>)
            const parentId = (await processParents(parentThread as ThreadViewPost)) as string
            return (await processSinglePost(postObject, parentId, forceUpdate)) as string
          }
        }
      } else {
        return (await processSinglePost(postObject, undefined, forceUpdate)) as string
      }
    }
  }

  // TODO optimize this a bit if post is not in reply to anything that we dont have
  const preThread = await getPostThreadSafe({ uri: uri, depth: 50, parentHeight: 1000 })
  if (preThread) {
    const thread: ThreadViewPost = preThread.data.thread as ThreadViewPost
    //const tmpDids = getDidsFromThread(thread)
    //forcePopulateUsers(tmpDids, (await adminUser) as Model<any, any>)
    let parentId: string | undefined = undefined
    if (thread.parent) {
      parentId = (await processParents(thread.parent as ThreadViewPost)) as string
    }
    const procesedPost = await processSinglePost(thread.post, parentId, forceUpdate)
    if (thread.replies && procesedPost) {
      for await (const repliesThread of thread.replies) {
        processReplies(repliesThread as ThreadViewPost, procesedPost)
      }
    }
    return procesedPost as string
  } else {
  }
}

async function processReplies(thread: ThreadViewPost, parentId: string) {
  if (thread && thread.post) {
    try {
      const post = await processSinglePost(thread.post, parentId)
      if (thread.replies && post) {
        for await (const repliesThread of thread.replies) {
          processReplies(repliesThread as ThreadViewPost, post)
        }
      }
    } catch (error) {
      logger.debug({
        message: `Error processing bluesky replies`,
        error: error,
        thread: thread,
        parentId
      })
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
  if (!post || !completeEnvironment.enableBsky) {
    return undefined
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
  let postCreator: User | undefined
  try {
    postCreator = await getAtprotoUser(post.author.did, (await adminUser) as User, post.author)
  } catch (error) {
    logger.debug({
      message: `Problem obtaining user from post`,
      post,
      parentId,
      forceUpdate,
      error
    })
  }
  if (!postCreator || !post) {
    const usr = postCreator ? postCreator : await User.findOne({ where: { url: completeEnvironment.deletedUser } })

    const invalidPost = await Post.create({
      userId: usr?.id,
      content: `Failed to get atproto post`,
      parentId: parentId,
      isDeleted: true,
      createdAt: new Date(0),
      updatedAt: new Date(0)
    })
    return invalidPost.id
  }
  if (postCreator) {
    const medias = getPostMedias(post)
    let tags: string[] = []
    let mentions: string[] = []
    let record = post.record as any
    let postText = record.text
    if (record.facets && record.facets.length > 0) {
      // lets get mentions
      const mentionedDids = record.facets
        .flatMap((elem: any) => elem.features)
        .map((elem: any) => elem.did)
        .filter((elem: any) => elem)
      if (mentionedDids && mentionedDids.length > 0) {
        const mentionedUsers = await User.findAll({
          where: {
            bskyDid: {
              [Op.in]: mentionedDids
            }
          }
        })
        mentions = mentionedUsers.map((elem) => elem.id)
      }

      const rt = new RichText({
        text: postText,
        facets: record.facets
      })
      let text = ''

      for (const segment of rt.segments()) {
        if (segment.isLink()) {
          const href = segment.link?.uri
          text += `<a href="${href}" target="_blank">${href}</a>`
        } else if (segment.isMention()) {
          const href = `${completeEnvironment.frontendUrl}/blog/${segment.mention?.did}`
          text += `<a href="${href}" target="_blank">${segment.text}</a>`
        } else if (segment.isTag()) {
          const href = `${completeEnvironment.frontendUrl}/dashboard/search/${segment.text.substring(1)}`
          text += `<a href="${href}" target="_blank">${segment.text}</a>`
          tags.push(segment.text.substring(1))
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
      createdAt: new Date((post.record as any).createdAt),
      privacy: Privacy.Public,
      parentId: parentId,
      content_warning: getPostLabels(post)
    }
    if (!parentId) {
      delete newData.parentId
    }

    // very dirty thing but at times somehting can happen that a post gets through the firehose before than the db.
    // this is dirty but we dont get the bsky uri until we post there...
    // so as a temporary hack, if user is local we wait 2 seconds
    if ((await getAllLocalUserIds()).includes(newData.userId)) {
      await wait(2000)
    }
    let [postToProcess, created] = await Post.findOrCreate({ where: { bskyUri: post.uri }, defaults: newData })
    // do not update existing posts. But what if local user creates a post through bsky? then we force updte i guess
    if (!(await getAllLocalUserIds()).includes(postToProcess.userId) || created) {
      if (!created) {
        postToProcess.set(newData)
        await postToProcess.save()
      }
      if (medias) {
        await Media.destroy({
          where: {
            postId: postToProcess.id
          }
        })
        await Media.bulkCreate(
          medias.map((media: any) => {
            return { ...media, postId: postToProcess.id }
          })
        )
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
            userId: postToProcess.userId,
            createdAt: new Date(postToProcess.createdAt)
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
        if (quotedPostId) {
          const quotedPost = await Post.findByPk(quotedPostId)
          if (quotedPost) {
            await createNotification(
              {
                notificationType: 'QUOTE',
                notifiedUserId: quotedPost.userId,
                userId: postToProcess.userId,
                postId: postToProcess.id
              },
              {
                postContent: postToProcess.content,
                userUrl: postCreator?.url
              }
            )
            await Quotes.findOrCreate({
              where: {
                quoterPostId: postToProcess.id,
                quotedPostId: quotedPostId
              }
            })
          }
        }
      }
    }

    return postToProcess.id
  }
}

function getPostMedias(post: PostView) {
  let res: any = []
  const embed = (post.record as any).embed
  if (embed) {
    if (embed.external) {
      res = res.concat([
        {
          mediaType: !embed.external.uri.startsWith('https://media.ternor.com/') ? 'text/html' : 'image/gif',
          description: embed.external.title,
          url: embed.external.uri,
          mediaOrder: 0,
          external: true
        }
      ])
    }
    if (embed.images || embed.media) {
      // case with quote and gif / link preview
      if (embed.media?.external) {
        res = res.concat([
          {
            mediaType: !embed.media.external.uri.startsWith('https://media.ternor.com/') ? 'text/html' : 'image/gif',
            description: embed.media.external.title,
            url: embed.media.external.uri,
            mediaOrder: 0,
            external: true
          }
        ])
      } else {
        const thingToProcess = embed.images ? embed.images : embed.media.images
        if (thingToProcess) {
          const toConcat = thingToProcess.map((media: any, index: any) => {
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
  const embed = (post.record as any).embed
  if (embed && ['app.bsky.embed.record'].includes(embed['$type'])) {
    res = embed.record.uri
  }
  // case of post with pictures and quote
  else if (embed && ['app.bsky.embed.recordWithMedia'].includes(embed['$type'])) {
    res = embed.record.record.uri
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

async function getPostThreadSafe(options: any) {
  try {
    // added a pause of 100 miliseconds for each petition. Will things explode? only ONE way to figure out.
    // if this works means that there is something here that is too much for the PDS
    await wait(100)
    const agent = await getAtProtoSession((await adminUser) as User)
    return await agent.getPostThread(options)
  } catch (error) {
    logger.debug({
      message: `Error trying to get atproto thread`,
      options: options,
      error: error
    })
  }
}

export { getAtProtoThread }

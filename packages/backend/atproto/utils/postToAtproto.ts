import { Model } from 'sequelize'
import { BskyAgent, RichText } from '@atproto/api'
import { Media, Post, Quotes, User } from '../../db.js'
import { environment } from '../../environment.js'
import fs from 'fs/promises'
import { getPostUrlForQuote } from '../../utils/activitypub/postToJSONLD.js'
import RichtextBuilder from '@atcute/bluesky-richtext-builder'
import { Main } from '@atproto/api/dist/client/types/app/bsky/richtext/facet.js'

async function postToAtproto(post: Model<any, any>, agent: BskyAgent) {
  let labels: any = undefined
  const quotedPostId = (await Quotes.findOne({
    where: {
      quoterPostId: post.id
    }
  })) as Model<any, any>
  let bskyQuote
  let quotedPost
  if (quotedPostId) {
    quotedPost = await Post.findByPk(quotedPostId.quotedPostId, {
      include: [
        {
          model: User,
          as: 'user'
        }
      ]
    })
    if (quotedPost.bskyUri) {
      bskyQuote = {
        $type: 'app.bsky.embed.record',
        record: {
          uri: quotedPost.bskyUri,
          cid: quotedPost.bskyCid
        }
      }
    }
  }

  const contentWarning = post.content_warning ? `[${post.content_warning.trim()}]\n` : ''
  const tags = (await post.getPostTags()).map((elem) => `#${elem.tagName.trim().replaceAll(' ', '-')}`).join(' ')
  let postText: string = (contentWarning + post.markdownContent.trim() + ' ' + tags).trim()

  if (quotedPost && !bskyQuote) {
    const remoteId = getPostUrlForQuote(quotedPost)
    postText = postText + '\nRE: ' + remoteId
  }

  let question: string | undefined
  const ask = await post.getAsk()
  if (ask) {
    const userAsker = await User.findByPk(ask.userAsker)
    if (userAsker) {
      question = `${userAsker.url} asked:`
      postText = `${question} ${ask.question}\n\n${postText}`
    }
  }

  const medias = await Media.findAll({
    where: {
      postId: post.id
    }
  })

  if (contentWarning != '' || medias.some((media) => media.NSFW)) {
    labels = {
      $type: 'com.atproto.label.defs#selfLabels',
      values: [{ val: 'graphic-media' }]
    }
  }

  let maxMediaSize = 0
  const mediasToNotSend: number[] = []
  for await (const [index, media] of medias.entries()) {
    const data = await fs.stat('uploads/' + media.url)
    maxMediaSize = maxMediaSize > data.size ? maxMediaSize : data.size
    if (data.size > 1000000 || media.url.endsWith('mp4')) {
      mediasToNotSend.push(index)
    }
  }

  const tmpRichText = new RichText({ text: postText })
  if (tmpRichText.length > 300 || medias.length > 4 || maxMediaSize > 1000000) {
    postText =
      postText.slice(0, 150) + `... see complete post at https://${environment.instanceUrl}/fediverse/post/${post.id}`
  }

  const bskyMedias = medias
    .filter((elem: any, index) => !mediasToNotSend.includes(index))
    .map(async (media) => {
      const file = await fs.readFile('uploads/' + media.url)
      const image = Buffer.from(file)
      const { data } = await agent.uploadBlob(image, { encoding: media.mediaType })
      return {
        alt: media.description,
        image: data.blob,
        labels: labels ? labels : undefined,
        aspectRatio: {
          width: media.width,
          height: media.height
        }
      }
    })

  const rt = new RichText({
    text: postText
  })
  await rt.detectFacets(agent)

  if (question) {
    const { facets } = new RichtextBuilder().addLink(question, `https://${environment.instanceUrl}/fediverse/post/${post.id}`);
    if (rt.facets)
      rt.facets.unshift(facets[0] as Main)
    else
      rt.facets = [facets[0] as Main]
  }

  let res: any = {
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date(post.createdAt).toISOString(),
    fullTexk: post.content,
    fullTags: tags,
    fediverseId: `${environment.frontendUrl}/fediverse/post/${post.id}`
  }
  if (bskyMedias.length) {
    res.embed = {
      $type: 'app.bsky.embed.images',
      images: await Promise.all(bskyMedias)
    }
  }
  if (post.parentId) {
    // ok this post is in reply to something
    const parent = (await Post.findByPk(post.parentId)) as Model<any, any>
    const ancestors = await post.getAncestors({
      where: {
        hierarchyLevel: 1
      }
    })
    const rootPost = ancestors[0]
    res.reply = {
      root: {
        uri: rootPost.bskyUri,
        cid: rootPost.bskyCid
      },
      parent: {
        uri: parent.bskyUri,
        cid: parent.bskyCid
      }
    }
  }

  if (bskyQuote) {
    res.embed = bskyQuote
  }
  if (labels) {
    res.labels = labels
  }
  return res
}

export { postToAtproto }

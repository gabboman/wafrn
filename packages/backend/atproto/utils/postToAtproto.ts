import { Model } from 'sequelize'
import { BskyAgent, RichText } from '@atproto/api'
import { Media, Post, PostMentionsUserRelation, Quotes, User } from '../../db.js'
import { environment } from '../../environment.js'
import fs from 'fs/promises'
import { getPostUrlForQuote } from '../../utils/activitypub/postToJSONLD.js'
import RichtextBuilder from '@atcute/bluesky-richtext-builder'
import { Main } from '@atproto/api/dist/client/types/app/bsky/richtext/facet.js'
import { tokenize } from '@atcute/bluesky-richtext-parser'
import { removeMarkdown } from './removeMarkdown.js'
import optimizeMedia from '../../utils/optimizeMedia.js'

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

  const mentionedUserRelations = await PostMentionsUserRelation.findAll({
    where: {
      postId: post.id
    }
  })

  for (const mentionedRelation of mentionedUserRelations) {
    const user = await User.findByPk(mentionedRelation.userId)
    const escapedUrl = user.url.replaceAll(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
    let mentionRegex = new RegExp(`(?<=\\s|^)(@${escapedUrl})(?=\\s|$)`, 'gm')

    // Fedi users
    if (user.remoteMentionUrl) {
      // A Fedi user url already has an @ in the start
      mentionRegex = new RegExp(`(?<=\\s|^)(${escapedUrl})(?=\\s|$)`, 'gm')
      postText = postText.replaceAll(mentionRegex, `[@${user.url.split('@')[1]}](${user.remoteMentionUrl})`)
      continue
    }

    // Local users
    if (!user.isBlueskyUser) {
      if (user.bskyDid && user.enableBsky) {
        const response = await agent.getProfile({ actor: user.bskyDid })
        if (response.data) postText = postText.replaceAll(mentionRegex, `@${response.data.handle}`)
      } else {
        postText = postText.replaceAll(
          mentionRegex,
          `[@${user.url}](${environment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()})`
        )
      }
    }
  }

  const ask = await post.getAsk()
  if (ask) {
    const userAsker = await User.findByPk(ask.userAsker)
    if (userAsker) {
      postText =
        `[${userAsker.name} asked:](https://${environment.instanceUrl}/fediverse/post/${post.id}) ` +
        `${ask.question}\n\n${postText}`
    }
    else {
      postText =
        `[Anonymous asked:](https://${environment.instanceUrl}/fediverse/post/${post.id}) ` +
        `${ask.question}\n\n${postText}`
    }
  }

  postText = removeMarkdown(postText)
  const builder = new RichtextBuilder()
  tokenize(postText).forEach((token) => {
    if (token.type === 'link') builder.addLink(token.text, token.url)
    else builder.addText(token.raw)
  })
  postText = builder.text

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

  const mediasToNotSend: number[] = []
  for await (const [index, media] of medias.entries()) {
    const data = await fs.stat('uploads/' + media.url)
    if (media.url.endsWith('mp4')) {
      mediasToNotSend.push(index)
    }
  }

  const tmpRichText = new RichText({ text: postText })
  let postShortened: boolean = false
  if (tmpRichText.length > 300 || medias.length > 4 || mediasToNotSend.length > 0) {
    postText =
      // Slice a bit more to account for unicode and such
      postText.slice(0, 290) + "[...]"
    postShortened = true
  }

  const bskyMedias = medias
    .filter((elem: any, index) => !mediasToNotSend.includes(index))
    .map(async (media) => {
      let file = await fs.readFile('uploads/' + media.url)
      if (file.length > 1000000) {
        // well this image is TOO BIG. time to convert it
        const localFilename = await optimizeMedia('uploads/' + media.url, {
          outPath: 'uploads/' + media.id + '_bsky',
          maxSize: 768,
          keep: true
        })
        file = await fs.readFile('uploads/' + media.id + '_bsky.webp')
      }
      const image = Buffer.from(file)
      const { data } = await agent.uploadBlob(image, { encoding: media.mediaType })
      return {
        alt: media.description ? media.description : '',
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

  const encoder = new TextEncoder()
  const byteSliceLength = encoder.encode(postText.slice(0, 150)).byteLength
  builder.facets.forEach((facet) => {
    // Do not add facets representing links that were removed
    if (postShortened && facet.index.byteEnd > byteSliceLength) return

    if (rt.facets) rt.facets.push(facet as Main)
    else rt.facets = [facet as Main]
  })

  let res: any = {
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date(post.createdAt).toISOString(),
    fullText: post.content,
    fullTags: tags,
    fediverseId: `${environment.frontendUrl}/fediverse/post/${post.id}`
  }

  if (bskyMedias.length) {
    res.embed = {
      $type: 'app.bsky.embed.images',
      images: await Promise.all(bskyMedias)
    }
  }

  if (postShortened) {
    res.embed = {
      $type: 'app.bsky.embed.external',
      external: {
        uri: `https://${environment.instanceUrl}/fediverse/post/${post.id}`,
        title: `See complete post at ${environment.instanceUrl}`,
        description: `${environment.instanceUrl} is a Wafrn server. Wafrn is a federated social media inspired by Tumblr, join us and have fun!`
      }
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

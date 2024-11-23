import { Model } from "sequelize";
import { BskyAgent, RichText } from "@atproto/api";
import { Media, Post, Quotes } from "../../db.js";
import { environment } from "../../environment.js";
import fs from "fs/promises";

async function postToAtproto(post: Model<any, any>, agent: BskyAgent) {
  const quotedPostId = await Quotes.findOne({
    where: {
      quoterPostId: post.id
    }
  }) as Model<any, any>
  let bskyQuote;
  let quotedPost;
  if (quotedPostId) {
    quotedPost = await Post.findByPk(quotedPostId.quotedPostId);
    bskyQuote = {
      "$type": "app.bsky.embed.record",
      "record": {
        "uri": quotedPost.bskyUri,
        "cid": quotedPost.bskyCid
      }
    }
  }
  const contentWarning = post.content_warning ? `[${post.content_warning.trim()}]` : ''
  const tags = (await post.getPostTags()).map(elem => `#${elem.tagName.trim().replaceAll(' ', '-')}`).join(' ')
  let postText: string = (contentWarning + post.markdownContent + tags).trim()
  if (quotedPost && !bskyQuote) {
    const remoteId = quotedPost.remoteId ? quotedPost.remoteId : `https://${environment.instanceUrl}/fediverse/post/${quotedPost.id}`;
    postText = postText + "\nRE: " + remoteId
  }
  const medias = await Media.findAll({
    where: {
      postId: post.id
    }
  });
  let maxMediaSize = 0;
  const mediasToNotSend: number[] = []
  for await (const [index, media] of medias.entries()) {
    const data = await fs.stat('uploads/' + media.url);
    maxMediaSize = maxMediaSize > data.size ? maxMediaSize : data.size;
    if (data.size > 1000000) {
      mediasToNotSend.push(index)
    }
  }
  const tmpRichText = new RichText({ text: postText })
  if (tmpRichText.length > 300 || medias.length > 4 || maxMediaSize > 1000000) {
    postText = postText.slice(0, 150) + `... see complete post at https://${environment.instanceUrl}/fediverse/post/${post.id}`
  }
  const bskyMedias = medias.filter((elem: any, index) => !mediasToNotSend.includes(index)).map(async (media) => {
    const file = await fs.readFile('uploads/' + media.url);
    const image = Buffer.from(file);
    const { data } = await agent.uploadBlob(image, { encoding: media.mediaType })
    return {
      alt: media.description,
      image: data.blob,
      aspectRatio: {
        width: media.width,
        height: media.height,
      }
    }
  })
  const rt = new RichText({
    text: postText
  });
  await rt.detectFacets(agent);
  let res: any = {
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date(post.createdAt).toISOString()
  }
  if (bskyMedias.length) {
    res.embed = {
      $type: 'app.bsky.embed.images',
      images: await Promise.all(bskyMedias)
    }
  }
  if (post.parentId) {
    // ok this post is in reply to something
    const parent = await Post.findByPk(post.parentId) as Model<any, any>
    const ancestors = await post.getAncestors({
      where: {
        hierarchyLevel: 1
      }
    })
    const rootPost = ancestors[0]
    res.reply = {
      root: {
        uri: rootPost.bskyUri,
        cid: rootPost.bskyCid,
      },
      parent: {
        uri: parent.bskyUri,
        cid: parent.bskyCid,
      }
    }
  }

  if (bskyQuote) {
    res.embed = bskyQuote
  }

  return res;
}

export { postToAtproto }

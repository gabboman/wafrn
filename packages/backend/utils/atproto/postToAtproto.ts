import {Model} from "sequelize";
import {BskyAgent, RichText} from "@atproto/api";
import {Media} from "../../db.js";
import {environment} from "../../environment.js";
import fs from "fs/promises";

// TODO in reply to.
async function postToAtproto(post: Model<any, any>, agent: BskyAgent) {
  let postText: string = post.markdownContent
  const medias = await Media.findAll({
    where: {
      postId: post.id
    }
  });
  let maxMediaSize = 0;
  const mediasToNotSend: number[] = []
  for await (const [index, media] of medias.entries()) {
    const data = await fs.stat('uploads/' +media.url);
    maxMediaSize = maxMediaSize > data.size ? maxMediaSize : data.size;
    if(data.size > 1000000) {
      mediasToNotSend.push(index)
    }
  }
  const tmpRichText =  new RichText({ text: postText })
  if(tmpRichText.length > 300 || medias.length > 4 || maxMediaSize > 1000000 ) {
    postText = postText.slice(0, 150) + `... see complete post at https://${environment.instanceUrl}/fediverse/post/${post.id}`
  }
  const bskyMedias = medias.filter((elem: any, index) => !mediasToNotSend.includes(index)).map(async (media) => {
    const file = await fs.readFile('uploads/' + media.url);
    const image = Buffer.from(file);
    const { data } = await agent.uploadBlob(image, { encoding: media.mediaType} )
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
  let res: any =  {
    text: rt.text,
    facets: rt.facets,
    createdAt: new Date(post.createdAt).toISOString()
  }
  if(bskyMedias.length) {
    res.embed = {
      $type:'app.bsky.embed.images',
      images: await Promise.all(bskyMedias)
    }
  }
  return res;
}

export {postToAtproto}

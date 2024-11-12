
// returns the post id
import {getAtProtoSession} from "./getAtProtoSession.js";
import {QueryParams} from "@atproto/sync/dist/firehose/lexicons.js";
import {Media, Post, User} from "../../db.js";
import {environment} from "../../environment.js";
import {Model} from "sequelize";
import {PostView, ThreadViewPost} from "@atproto/api/dist/client/types/app/bsky/feed/defs.js";
import {getAtprotoUser} from "./getAtprotoUser.js";
import {CreateOrUpdateOp} from "@skyware/firehose";
const adminUser =  User.findOne({
  where: {
    url: environment.adminUser
  }
})
const agent = await getAtProtoSession(await adminUser as Model<any, any>);

async function getAtProtoThread(uri: string, operation?: { operation: CreateOrUpdateOp, remoteUser: Model<any, any> }): Promise<string> {
  if(operation ) {
    const postExisting = await Post.findOne({
      where: {
        bskyUri: uri
      }
    })
    if (postExisting) {
      return postExisting.id;
    }
  }

  // TODO optimize this a bit if post is not in reply to anything that we dont have
  const thread: ThreadViewPost =  (await agent.getPostThread({uri: uri, depth: 1000, parentHeight: 1000})).data.thread as ThreadViewPost

  let parentId: string | undefined  = undefined
  if(thread.parent) {
    parentId = await processParents(thread.parent as ThreadViewPost) as string
  }
  const procesedPost = await processSinglePost(thread.post, parentId)
  if(thread.replies && procesedPost) {
    for await (const repliesThread  of thread.replies) {
      processReplies(repliesThread, procesedPost)
    }
  }
  return procesedPost as string;
}

async function processReplies(thread: ThreadViewPost, parentId: string) {
  const post = await processSinglePost(thread.post, parentId)
  if(thread.replies && post){
    for await (const repliesThread  of thread.replies) {
      processReplies(repliesThread, post)

    }
  }
}

async function processParents(thread: ThreadViewPost): Promise<string | undefined> {
  let parentId: string | undefined = undefined;
  if(thread.parent){
    parentId = await processParents(thread.parent as ThreadViewPost)
  }
  return await processSinglePost(thread.post, parentId)
}

async function processSinglePost(post: PostView, parentId?: string): Promise<string | undefined> {
  const postCreator = await getAtprotoUser(post.author.did, await adminUser as Model<any, any>, post.author )
  if(postCreator) {
    const medias = post.record.embed?.images?.map((media, index) => {
      return {
        mediaType: media.image.mimetype,
        description: media.alt,
        height: media.aspectRatio?.height,
        width: media.aspectRatio?.width,
        url: Buffer.from(media.image.original.ref.multihash.bytes).toString(),
        mediaOrder: index
      }
    })

    const newData = {
      userId: postCreator.id,
      bskyCid: post.cid,
      bskyUri: post.uri,
      content: post.record.text,
      createdAt: new Date(post.record.createdAt),
      privacy: 0,
      parentId: parentId,
    }
    if(!parentId) {
      delete newData.parentId
    }
    let postToProcess = await Post.findOne({
      where: {userId: postCreator.id, bskyCid: post.cid, bskyUri: post.uri},
    })
    if(!postToProcess) {
      postToProcess = await Post.create(newData);
      if(medias) {
        await Media.bulkCreate(medias.map((media: any) => {return {...media, postId: postToProcess.id}}))
      }
    }
    return postToProcess.id
  }

}

export {getAtProtoThread}

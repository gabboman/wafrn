//import { getAtProtoThread } from './atproto/utils/getAtProtoThread.js'

import { Op } from 'sequelize'
import { getAtProtoThread } from './atproto/utils/getAtProtoThread.js'
import { Media, Post, PostTag, Quotes, User } from './models/index.js'
import { environment } from './environment.js'
import { getRemoteActor } from './utils/activitypub/getRemoteActor.js'
import { MoveActivity } from './utils/activitypub/processors/move.js'
import sendActivationEmail from './utils/sendActivationEmail.js'
import { wait } from './utils/wait.js'
import { getAtProtoSession } from './atproto/utils/getAtProtoSession.js'
import { postToAtproto } from './atproto/utils/postToAtproto.js'

// https://bsky.app/profile/did:plc:kcu5gsklhhensnm6vhu6lhq5/post/3lkw3tgtihs23
//await getAtProtoThread('at://did:plc:kcu5gsklhhensnm6vhu6lhq5/app.bsky.feed.post/3lljrwzmx522w', undefined, true)

const post = (await Post.findByPk('72d87a3f-0bc7-4c53-988c-c9e29e2ae6b7')) as Post
const user = (await User.findByPk(post.userId)) as User
const agent = await getAtProtoSession(user)
let isReblog = false
if (post.content == '' && post.content_warning == '' && post.parentId) {
  const mediaCount = await Media.count({
    where: {
      postId: post.id
    }
  })
  const quotesCount = await Quotes.count({
    where: {
      quoterPostId: post.id
    }
  })
  const tagsCount = await PostTag.count({
    where: {
      postId: post.id
    }
  })
  if (mediaCount + quotesCount + tagsCount === 0) {
    isReblog = true
  }
}
if (!isReblog) {
  const bskyPost = await agent.post(await postToAtproto(post, agent))
  post.bskyUri = bskyPost.uri
  post.bskyCid = bskyPost.cid
  await post.save()
}

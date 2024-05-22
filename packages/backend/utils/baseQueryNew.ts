import { Op } from 'sequelize'
import {
  Emoji,
  EmojiReaction,
  Media,
  Post,
  PostEmojiRelations,
  PostMentionsUserRelation,
  PostTag,
  QuestionPoll,
  QuestionPollAnswer,
  QuestionPollQuestion,
  Quotes,
  User,
  UserEmojiRelation,
  UserLikesPostRelations
} from '../db'
import getPosstGroupDetails from './getPostGroupDetails'
import getFollowedsIds from './cacheGetters/getFollowedsIds';

async function getQuotes(
  postIds: string[]
): Promise<{ quoterPostId: string; quotedPostId: string; createdAt: Date }[]> {
  return await Quotes.findAll({
    where: {
      quoterPostid: {
        [Op.in]: postIds
      }
    }
  })
}

async function getMedias(postIds: string[]) {
  return await Media.findAll({
    attributes: ['id', 'NSFW', 'description', 'url', 'adultContent', 'external', 'order'],
    include: [
      {
        model: Post,
        attributes: ['id'],
        where: {
          id: {
            [Op.in]: postIds
          }
        }
      }
    ]
  })
}
async function getMentionedUserIds(
  postIds: string[]
): Promise<{ usersMentioned: string[]; postMentionRelation: any[] }> {
  const mentions = await PostMentionsUserRelation.findAll({
    attributes: ['userId', 'postId'],
    where: {
      postId: {
        [Op.in]: postIds
      }
    }
  })
  const usersMentioned = mentions.map((elem: any) => elem.userId)
  const postMentionRelation = mentions.map((elem: any) => {
    return { userMentioned: elem.userId, post: elem.postId }
  })
  return { usersMentioned, postMentionRelation }
}

async function getTags(postIds: string[]) {
  return await PostTag.findAll({
    attributes: ['postId', 'tagName'],
    where: {
      postId: {
        [Op.in]: postIds
      }
    }
  })
}

async function getLikes(postIds: string[]) {
  return await UserLikesPostRelations.findAll({
    attributes: ['userId', 'postId'],
    where: {
      postId: {
        [Op.in]: postIds
      }
    }
  })
}

async function getEmojis(input: { userIds: string[]; postIds: string[] }): Promise<{
  userEmojiRelation: any[]
  postEmojiRelation: any[]
  postEmojiReactions: any[]
  emojis: []
}> {
  let postEmojisIds = PostEmojiRelations.findAll({
    attributes: ['emojiId', 'postid'],
    where: {
      postId: {
        [Op.in]: input.postIds
      }
    }
  })

  let postEmojiReactions = EmojiReaction.findAll({
    attributes: ['emojiId', 'postid', 'userId', 'content'],
    where: {
      postId: {
        [Op.in]: input.postIds
      }
    }
  })

  let userEmojiId = UserEmojiRelation.findAll({
    attributes: ['emojiId', 'userId'],
    where: {
      userId: {
        [Op.in]: input.userIds
      }
    }
  })

  await Promise.all([postEmojisIds, userEmojiId, postEmojiReactions])
  postEmojisIds = await postEmojisIds
  userEmojiId = await userEmojiId
  postEmojiReactions = await postEmojiReactions

  const emojiIds = []
    .concat(postEmojisIds.map((elem: any) => elem.emojiId))
    .concat(userEmojiId.map((elem: any) => elem.emojiId))
    .concat(postEmojiReactions.map((reaction: any) => reaction.emojiId))
  return {
    userEmojiRelation: await userEmojiId,
    postEmojiRelation: await postEmojisIds,
    postEmojiReactions: await postEmojiReactions,
    emojis: await Emoji.findAll({
      attributes: ['id', 'url', 'external', 'name'],
      where: {
        id: {
          [Op.in]: emojiIds
        }
      }
    })
  }
}

async function getUnjointedPosts(postIdsInput: string[], posterId: string) {
  // we need a list of all the userId we just got from the post
  let userIds: string[] = []
  let postIds: string[] = []
  const posts = await Post.findAll({
    include: [
      {
        model: Post,
        as: 'ancestors'
      }
    ],
    where: {
      id: {
        [Op.in]: postIdsInput
      }
    }
  })
  posts.forEach((post: any) => {
    userIds.push(post.userId)
    postIds.push(post.id)
    post.ancestors?.forEach((ancestor: any) => {
      userIds.push(ancestor.userId)
      postIds.push(ancestor.id)
    })
  })
  const quotes = await getQuotes(postIds)
  const quotedPostsIds = quotes.map((quote) => quote.quotedPostId)
  postIds = postIds.concat(quotedPostsIds)
  const quotedPosts = await Post.findAll({
    where: {
      id: {
        [Op.in]: quotedPostsIds
      }
    }
  })
  userIds = userIds.concat(quotedPosts.map((q: any) => q.userId))
  const emojis = getEmojis({
    userIds,
    postIds
  })
  const mentions = await getMentionedUserIds(postIds)
  userIds = userIds.concat(mentions.usersMentioned)
  userIds = userIds.concat((await emojis).postEmojiReactions.map((react: any) => react.userId))
  const polls = QuestionPoll.findAll({
    where: {
      postId: {
        [Op.in]: postIds
      }
    },
    include: [
      {
        model: QuestionPollQuestion,
        include: [
          {
            model: QuestionPollAnswer,
            required: false,
            where: {
              userId: posterId
            }
          }
        ]
      }
    ]
  })
  const medias = getMedias(postIds)
  const tags = getTags(postIds)
  const likes = await getLikes(postIds)
  userIds = userIds.concat(likes.map((like: any) => like.userId))
  const users = User.findAll({
    attributes: ['url', 'avatar', 'id', 'name', 'remoteId'],
    where: {
      id: {
        [Op.in]: userIds
      }
    }
  })
  const postWithNotes = getPosstGroupDetails(posts)
  await Promise.all([emojis, users, polls, medias, tags, postWithNotes])
  const usersFollowedByPoster = await getFollowedsIds(posterId)
  const postsMentioningUser: string [] = mentions.postMentionRelation.filter((mention: any) => mention.userMentioned === posterId ).map((mention: any) => mention.post)
  const allPosts = (await postWithNotes).concat((await postWithNotes).flatMap((elem: any) => elem.ancestors))
  const postIdsToFullySend: string[] = allPosts.filter((post: any) => 
    post.privacy === 0 || post.privacy === 2 || post.privacy === 3 || 
    (post.privacy === 1 && usersFollowedByPoster.includes(post.userId)) 
    || postsMentioningUser.includes(post.id)
    ).map((post: any) => post.id)

  const postsToSend = (await postWithNotes).map((post: any) => {
    const res = {... post}
    if(!postIdsToFullySend.includes(res.id)) {
      res.content = res.privacy === 10 ? 'This post is marked as private and you do not have access to it' :'You do not follow this user and this post is marked as followers only.'
    }
    res.ancestors = res.ancestors.filter((elem: any) => postIdsToFullySend.includes(elem.id) )
    return res
  })

  const mediasToSend = (await medias).filter((elem: any) => {
    return postIdsToFullySend.includes(elem.posts[0].id)
  })
  const tagsFiltered = (await tags).filter((tag: any) => postIdsToFullySend.includes(tag.postId))
  const quotesFiltered = quotes.filter((quote: any) => postIdsToFullySend.includes(quote.quoterPostId))
  return {
    posts: postsToSend,
    emojiRelations: await emojis,
    mentions: mentions.postMentionRelation,
    users: await users,
    polls: await polls,
    medias: mediasToSend,
    tags: tagsFiltered,
    likes: likes,
    quotes: quotesFiltered,
    quotedPosts: await quotedPosts
  }
}

export { getUnjointedPosts, getMedias, getQuotes, getMentionedUserIds, getTags, getLikes, getEmojis }

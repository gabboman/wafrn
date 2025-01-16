import { Op } from 'sequelize'
import {
  Ask,
  Emoji,
  EmojiReaction,
  FederatedHost,
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
} from '../db.js'
import getPosstGroupDetails from './getPostGroupDetails.js'
import getFollowedsIds from './cacheGetters/getFollowedsIds.js'
import { Queue } from 'bullmq'
import { environment } from '../environment.js'

const updateMediaDataQueue = new Queue('processRemoteMediaData', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: 25000
  }
})

async function getQuotes(
  postIds: string[]
): Promise<{ quoterPostId: string; quotedPostId: string; createdAt: Date }[]> {
  return await Quotes.findAll({
    where: {
      quoterPostId: {
        [Op.in]: postIds
      }
    }
  })
}

async function getMedias(postIds: string[]) {
  const medias = await Media.findAll({
    attributes: [
      'id',
      'NSFW',
      'description',
      'url',
      'external',
      'mediaOrder',
      'mediaType',
      'postId',
      'blurhash',
      'width',
      'height'
    ],
    where: {
      postId: {
        [Op.in]: postIds
      }
    }
  })

  let mediasToProcess = medias.filter(
    (elem: any) => !elem.mediaType || (elem.mediaType?.startsWith('image') && !elem.width)
  )
  if (mediasToProcess && mediasToProcess.length > 0) {
    updateMediaDataQueue.addBulk(
      mediasToProcess.map((media: any) => {
        return {
          name: `getMediaData${media.id}`,
          data: { mediaId: media.id }
        }
      })
    )
  }
  return medias
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
    attributes: ['emojiId', 'postId'],
    where: {
      postId: {
        [Op.in]: input.postIds
      }
    }
  })

  let postEmojiReactions = EmojiReaction.findAll({
    attributes: ['emojiId', 'postId', 'userId', 'content'],
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
  const asks = await Ask.findAll({
    attributes: ['question', 'apObject', 'createdAt', 'updatedAt', 'postId', 'userAsked', 'userAsker'],
    where: {
      postId: {
        [Op.in]: postIds
      }
    }
  })

  const rewootedPosts = await Post.findAll({
    attributes: ['id', 'parentId'],
    where: {
      content: '',
      userId: posterId,
      parentId: {
        [Op.in]: postIds
      }
    }
  })
  const rewootIds = rewootedPosts.map((r: any) => r.id)

  userIds = userIds
    .concat(quotedPosts.map((q: any) => q.userId))
    .concat(asks.map((elem: any) => elem.userAsked))
    .concat(asks.map((elem: any) => elem.userAsker))
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

  let medias = getMedias([...postIds, ...rewootIds])
  let tags = getTags([...postIds, ...rewootIds])

  const likes = await getLikes(postIds)
  userIds = userIds.concat(likes.map((like: any) => like.userId))
  const users = User.findAll({
    attributes: ['url', 'avatar', 'id', 'name', 'remoteId', 'banned'],
    where: {
      id: {
        [Op.in]: userIds
      }
    }
  })
  const postWithNotes = getPosstGroupDetails(posts)
  await Promise.all([emojis, users, polls, medias, tags, postWithNotes])
  const hostsIds = (await users).filter((elem) => elem.federatedHostId).map((elem) => federatedHostId)
  const blockedHosts = await FederatedHost.findAll({
    where: {
      id: {
        [Op.in]: hostsIds
      },
      blocked: true
    }
  })
  const blockedHostsIds = blockedHosts.map((elem) => elem.id)
  const bannedUserIds = (await users)
    .filter((elem) => elem.banned || blockedHostsIds.includes(elem.federatedHostId))
    .map((elem) => elem.id)
  const usersFollowedByPoster = await getFollowedsIds(posterId)
  const tagsAwaited = await tags
  const mediasAwaited = await medias

  const invalidRewoots = [] as string[]
  for (const id of rewootIds) {
    const hasMedia = mediasAwaited.some((media: any) => media.postId === id)
    const hasTags = tagsAwaited.some((tag: any) => tag.postId === id)
    if (hasMedia || hasTags) {
      invalidRewoots.push(id)
    }
  }

  const finalRewootIds = rewootedPosts.filter((r: any) => !invalidRewoots.includes(r.id)).map((r: any) => r.parentId)

  const postsMentioningUser: string[] = mentions.postMentionRelation
    .filter((mention: any) => mention.userMentioned === posterId)
    .map((mention: any) => mention.post)
  const allPosts = (await postWithNotes)
    .concat((await postWithNotes).flatMap((elem: any) => elem.ancestors))
    .concat(await quotedPosts)
    .map((elem: any) => (elem.dataValues ? elem.dataValues : elem))
  const postsToFullySend = allPosts.filter((post: any) => {
    const postIsPostedByUser = post.userId === posterId
    const isReblog =
      post.content === '' &&
      !tagsAwaited.some((tag: any) => tag.postId === post.id) &&
      !mediasAwaited.some((media: any) => media.postId === post.id)
    const validPrivacy = [0, 2, 3].includes(post.privacy)
    const userFollowsPoster = usersFollowedByPoster.includes(post.userId) && post.privacy === 1
    const userIsMentioned = postsMentioningUser.includes(post.id)
    return (
      !bannedUserIds.includes(post.userId) &&
      (postIsPostedByUser || validPrivacy || userFollowsPoster || userIsMentioned || isReblog)
    )
  })
  const postIdsToFullySend: string[] = postsToFullySend.map((post: any) => post.id)
  const postsToSend = (await postWithNotes).map((post: any) => filterPost(post, postIdsToFullySend))
  const mediasToSend = (await medias).filter((elem: any) => {
    return postIdsToFullySend.includes(elem.postId)
  })
  const tagsFiltered = (await tags).filter((tag: any) => postIdsToFullySend.includes(tag.postId))
  const quotesFiltered = quotes.filter((quote: any) => postIdsToFullySend.includes(quote.quoterPostId))
  const pollsFiltered = (await polls).filter((poll: any) => postIdsToFullySend.includes(poll.postId))
  return {
    rewootIds: finalRewootIds.filter((elem) => !!elem),
    posts: postsToSend.filter((elem) => !!elem),
    emojiRelations: await emojis,
    mentions: mentions.postMentionRelation.filter((elem) => !!elem),
    users: (await users).filter((elem) => !!elem),
    polls: pollsFiltered.filter((elem) => !!elem),
    medias: mediasToSend.filter((elem) => !!elem),
    tags: tagsFiltered.filter((elem) => !!elem),
    likes: likes.filter((elem) => !!elem),
    quotes: quotesFiltered.filter((elem) => !!elem),
    quotedPosts: (await quotedPosts).map((elem: any) => filterPost(elem, postIdsToFullySend)).filter((elem) => !!elem),
    asks: asks.filter((elem) => !!elem)
  }
}

function filterPost(postToBeFilter: any, postIdsToFullySend: string[]): any {
  let res = postToBeFilter
  if (!postIdsToFullySend.includes(res.id)) {
    res = undefined
  }
  if (res) {
    res.ancestors = res.ancestors ? res.ancestors.map((elem: any) => filterPost(elem, postIdsToFullySend)) : []
    res.ancestors = res.ancestors.filter((elem: any) => !(elem == undefined))
  }
  return res
}

export { getUnjointedPosts, getMedias, getQuotes, getMentionedUserIds, getTags, getLikes, getEmojis }

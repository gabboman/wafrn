import { Application, Request, Response } from 'express'
import { Op, Sequelize } from 'sequelize'
import {
  Blocks,
  Post,
  PostMentionsUserRelation,
  PostReport,
  ServerBlock,
  PostTag,
  User,
  Follows,
  UserLikesPostRelations,
  Media
} from '../db'
import { authenticateToken } from '../utils/authenticateToken'

import { sequelize } from '../db'

import getStartScrollParam from '../utils/getStartScrollParam'
import getPosstGroupDetails from '../utils/getPostGroupDetails'
import { logger } from '../utils/logger'
import { createPostLimiter } from '../utils/rateLimiters'
import { environment } from '../environment'
import { Queue } from 'bullmq'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import optionalAuthentication from '../utils/optionalAuthentication'
import { getPetitionSigned } from '../utils/activitypub/getPetitionSigned'
import { getPostThreadRecursive } from '../utils/activitypub/getPostThreadRecursive'
import * as htmlparser2 from 'htmlparser2'
import checkIpBlocked from '../utils/checkIpBlocked'
import { getUnjointedPosts } from '../utils/baseQueryNew'
const cheerio = require('cheerio')
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds'
import { federatePostHasBeenEdited } from '../utils/activitypub/editPost'
import { getAvaiableEmojis } from '../utils/getAvaiableEmojis'

const prepareSendPostQueue = new Queue('prepareSendPost', {
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
export default function postsRoutes(app: Application) {
  app.get('/api/v2/post/:id', optionalAuthentication, checkIpBlocked, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const userId = req.jwtData?.userId
    if (req.params?.id) {
      const unjointedPost = await getUnjointedPosts([req.params.id], userId ? userId : 'NOT-LOGGED-IN')
      const post = unjointedPost.posts[0]
      if (post) {
        const mentions = unjointedPost.mentions.map((elem: any) => elem.userMentioned)
        if (post.userId === userId || mentions.includes(userId) || post.privacy !== 10) {
          res.send(unjointedPost)
          success = true
        }
      }
    }

    if (!success) {
      res.send({ success: false })
    }
  })

  app.get(
    '/api/v2/descendents/:id',
    optionalAuthentication,
    checkIpBlocked,
    async (req: AuthorizedRequest, res: Response) => {
      const userId = req.jwtData?.userId ? req.jwtData.userId : 'NOT-LOGGED-IN'
      if (req.params?.id) {
        const posts = await Post.findOne({
          where: {
            id: req.params.id
          },
          attributes: [],
          include: [
            {
              model: Post,
              attributes: [
                'id',
                'userId',
                [sequelize.fn('LENGTH', sequelize.col('descendents.content')), 'len'],
                'createdAt',
                'updatedAt'
              ],
              as: 'descendents',
              where: {
                privacy: {
                  [Op.ne]: 10
                },
                [Op.or]: [
                  {
                    userId: userId
                  },
                  {
                    privacy: 1,
                    userId: {
                      [Op.in]: await getFollowedsIds(userId, false)
                    }
                  },
                  {
                    privacy: 0
                  }
                ]
              }
            }
          ]
        })
        const users = posts?.descendents?.length
          ? await User.findAll({
              attributes: ['url', 'avatar', 'name', 'id'],
              where: {
                id: {
                  [Op.in]: posts?.descendents.map((elem: any) => elem.userId)
                }
              }
            })
          : []
        res.send({
          posts: posts?.descendents?.length ? posts.descendents : [],
          users: users
        })
      } else {
        res.sendStatus(404)
      }
    }
  )
  app.get('/api/v2/blog', checkIpBlocked, optionalAuthentication, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const id = req.query.id

    if (id) {
      const blog = await User.findOne({
        where: {
          url: sequelize.where(sequelize.fn('LOWER', sequelize.col('url')), 'LIKE', (id as string).toLowerCase())
        }
      })
      const blogId = blog?.id
      if (blogId) {
        const privacyArray = [0, 2, 3]
        if (
          req.jwtData?.userId === blogId ||
          (req.jwtData?.userId &&
            (await Follows.count({
              where: {
                followedId: blogId,
                followerId: req.jwtData?.userId,
                accepted: true
              }
            })))
        ) {
          privacyArray.push(1)
        }
        const postIds = await Post.findAll({
          order: [['createdAt', 'DESC']],
          limit: environment.postsPerPage,
          attributes: ['id'],
          where: {
            createdAt: { [Op.lt]: getStartScrollParam(req) },
            userId: blogId,
            privacy: {
              [Op.in]: privacyArray
            }
          }
        })
        const postsByBlog = await getUnjointedPosts(
          postIds.map((post: any) => post.id),
          req.jwtData?.userId ? req.jwtData.userId : 'NOT-LOGGED-IN'
        )
        success = true
        res.send(postsByBlog)
      }
    }

    if (!success) {
      res.send({ success: false })
    }
  })

  app.post(
    '/api/v2/createPost',
    checkIpBlocked,
    authenticateToken,
    createPostLimiter,
    async (req: AuthorizedRequest, res: Response) => {
      let success = false
      const posterId = req.jwtData?.userId
      const postToBeQuoted = await Post.findByPk(req.body.postToQuote)
      try {
        const parent = await Post.findByPk(req.body.parent, {
          include: [
            {
              model: Post,
              as: 'ancestors'
            }
          ]
        })
        if (!parent && req.body.parent) {
          success = false
          res.status(500)
          res.send({ success: false, message: 'non existent parent' })
          return false
        }
        
        // we get the privacy of the parent and quoted post. Set body privacy to the max one
        const parentPrivacy: number = parent ? parent.privacy : 0
        let bodyPrivacy: number = req.body.privacy ? req.body.privacy : 0
        const quotedPostPrivacy: number = postToBeQuoted ? postToBeQuoted.privacy : 0
        bodyPrivacy = Math.max(parentPrivacy, bodyPrivacy, quotedPostPrivacy)
        // we check that the user is not reblogging a post by someone who blocked them or the other way arround
        if (parent) {
          const postParentsUsers: string[] = parent.ancestors.map((elem: any) => elem.userId)
          postParentsUsers.push(parent.userId)
          const bannedUsers = await User.count({
            where: {
              id: {
                [Op.in]: postParentsUsers
              },
              banned: true
            }
          })
          const blocksExistingOnParents = await Blocks.count({
            where: {
              [Op.or]: [
                {
                  blockerId: posterId,
                  blockedId: { [Op.in]: postParentsUsers }
                },
                {
                  blockedId: posterId,
                  blockerId: { [Op.in]: postParentsUsers }
                }
              ]
            }
          })
          if (blocksExistingOnParents + bannedUsers > 0) {
            success = false
            res.status(500)
            res.send({ success: false, message: 'You have no permission to reblog this post' })
            return false
          }
        }

        let content = req.body.content ? req.body.content.trim() : ''
        const content_warning = req.body.content_warning ? req.body.content_warning.trim() : ''
        const mentionsToAdd: string[] = []
        let mediaToAdd: any[] = []
        const avaiableEmojis = await getAvaiableEmojis()
        // we parse the content and we search emojis:
        const emojisToAdd = avaiableEmojis?.filter((emoji: any) => req.body.content.includes(emoji.name))

        // post content as html
        const parsedAsHTML = cheerio.load(content)
        const mentionsInPost = parsedAsHTML('a.mention')
        if (req.body.medias && req.body.medias.length) {
          mediaToAdd = req.body.medias
          // "not important" we update the media order
          const updateMediasPromises: Array<Promise<any>> = []
          Media.findAll({
            where: {
              id: {
                [Op.in]: mediaToAdd.map((media: any) => media.id)
              }
            }
          }).then((mediasToUpdate: Array<any>) => {
            mediaToAdd.forEach(async (media, index) => {
              const mediaToUpdate = mediasToUpdate.find((el: any) => el.id === media.id)
              if (mediaToUpdate) {
                mediaToUpdate.order = index
                mediaToUpdate.description = media.description
                mediaToUpdate.NSFW = media.NSFW
                mediaToUpdate.adultContent = media.adultContent
                await mediaToUpdate.save()
              }
            })
          })
        }

        if (mentionsInPost && mentionsInPost.length > 0) {
          for (let index = 0; index < mentionsInPost.length; index++) {
            const elem = mentionsInPost[index]
            if (elem.attribs['data-id'] && !mentionsToAdd.includes(elem.attribs['data-id'])) {
              mentionsToAdd.push(elem.attribs['data-id'])
            }
          }
          const blocksExisting = await Blocks.count({
            where: {
              [Op.or]: [
                {
                  blockerId: posterId,
                  blockedId: { [Op.in]: mentionsToAdd }
                },
                {
                  blockedId: posterId,
                  blockerId: { [Op.in]: mentionsToAdd }
                }
              ]
            }
          })
          const blocksServers = 0 /*await ServerBlock.count({
          where: {
            userBlockerId: posterId,
            literal: Sequelize.literal(
              `blockedServerId IN (SELECT federatedHostId from users where id IN (${  mentionsToAdd.map(
                (elem) => '"' + elem + '"'
              )}))`
            )
          }
        })*/
          if (blocksExisting + blocksServers > 0) {
            res.status(500)
            res.send({
              error: true,
              message: 'You can not mention an user that you have blocked or has blocked you'
            })
            return null
          }
          const usersMentioned = await User.findAll({
            where: {
              id: {
                [Op.in]: mentionsToAdd
              }
            }
          })
          if (usersMentioned && usersMentioned.length > 0) {
            if (mentionsInPost && mentionsInPost.length > 0) {
              for (let index = 0; index < mentionsInPost.length; index++) {
                const elem = mentionsInPost[index]
                if (elem.attribs['data-id']) {
                  const userMentioned = usersMentioned.find((usr: any) => elem.attribs['data-id'] === usr.id)
                  if (userMentioned) {
                    const url = userMentioned.url.startsWith('@')
                      ? `${userMentioned.url.split('@')[1]}`
                      : `${userMentioned.url}`
                    const remoteId = userMentioned.url.startsWith('@')
                      ? userMentioned.remoteId
                      : `${environment.frontendUrl}/fediverse/blog/${userMentioned.url}`
                    const remoteUrl = userMentioned.remoteMentionUrl ? userMentioned.remoteMentionUrl : remoteId
                    const toReplace = parsedAsHTML.html(elem)
                    content = content.replaceAll(
                      toReplace,
                      `<span class="h-card" translate="no"><a href="${remoteUrl}" class="u-url mention">@<span>${url}</span></a></span>`
                    )
                  }
                }
              }
            }
          }
        }
        let post: any
        if (req.body.idPostToEdit) {
          post = await Post.findByPk(req.body.idPostToEdit)
          post.content = content
          post.content_warning = content_warning
          post.privacy = bodyPrivacy
          await post.save()
        } else {
          post = await Post.create({
            content,
            content_warning,
            userId: posterId,
            privacy: bodyPrivacy,
            parentId: req.body.parent
          })
        }
        if(postToBeQuoted) {
          post.addQuoted(postToBeQuoted)
        }
        post.setMedias(mediaToAdd.map((media: any) => media.id))
        post.setMentionPost(mentionsToAdd)
        post.setEmojis(emojisToAdd)
        success = !req.body.tags
        if (req.body.tags) {
          const tagListString = req.body.tags
          let tagList: string[] = tagListString.split(',')
          tagList = tagList.map((s: string) => s.trim())
          await PostTag.destroy({
            where: {
              postId: post.id
            }
          })
          await PostTag.bulkCreate(
            tagList.map((tag) => {
              return {
                tagName: tag,
                postId: post.id
              }
            })
          )

          success = true
        }
        res.send(post)
        await post.save()
        if (post.privacy.toString() !== '2') {
          if (req.body.idPostToEdit) {
            await federatePostHasBeenEdited(post)
          } else {
            await prepareSendPostQueue.add(
              'prepareSendPost',
              { postId: post.id, petitionBy: posterId },
              { jobId: post.id }
            )
          }
        }
      } catch (error) {
        logger.error(error)
      }
      if (!success) {
        res.statusCode = 400
        res.send({ success: false })
      }
    }
  )

  app.post('/api/reportPost', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    let report
    try {
      const posterId = req.jwtData?.userId
      if (req.body?.postId && req.body.severity && req.body.description) {
        report = await PostReport.create({
          resolved: false,
          severity: req.body.severity,
          description: req.body.description,
          userId: posterId,
          postId: req.body.postId
        })
        success = true
        res.send(report)
      }
    } catch (error) {
      logger.error(error)
    }
    if (!success) {
      res.send({
        success: false
      })
    }
  })

  app.get('/api/loadRemoteResponses', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    try {
      const userId = req.jwtData?.userId
      const postToGetRepliesFromId = req.query.id
      let remotePost = Post.findByPk(postToGetRepliesFromId)
      let user = User.findByPk(userId)
      await Promise.all([user, remotePost])
      user = await user
      remotePost = await remotePost
      const postPetition = await getPetitionSigned(user, remotePost.remotePostId)
      if (postPetition) {
        if (postPetition.inReplyTo && remotePost.hierarchyLevel === 1) {
          const lostParent = await getPostThreadRecursive(user, postPetition.inReplyTo)
          await remotePost.setParent(lostParent)
        }
        // next replies to process
        let next = postPetition.replies.first
        while (next) {
          const petitions = next.items.map((elem: string) => getPostThreadRecursive(user, elem))
          await Promise.allSettled(petitions)
          next = next.next ? await getPetitionSigned(user, next.next) : undefined
        }
      }
    } catch (error) {
      logger.debug({ message: 'error getting external responses', error: error })
    }
    res.send({})
  })
}

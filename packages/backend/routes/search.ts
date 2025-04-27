import { Application, Response } from 'express'
import { Op, Sequelize } from 'sequelize'
import { Emoji, Post, PostTag, User, UserEmojiRelation } from '../models/index.js'
import { sequelize } from '../models/index.js'

import getStartScrollParam from '../utils/getStartScrollParam.js'
import getPosstGroupDetails from '../utils/getPostGroupDetails.js'
import optionalAuthentication from '../utils/optionalAuthentication.js'
import { authenticateToken } from '../utils/authenticateToken.js'

import { searchRemoteUser } from '../utils/activitypub/searchRemoteUser.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { environment } from '../environment.js'
import { getPostThreadRecursive } from '../utils/activitypub/getPostThreadRecursive.js'
import checkIpBlocked from '../utils/checkIpBlocked.js'
import { getAllLocalUserIds } from '../utils/cacheGetters/getAllLocalUserIds.js'
import { getallBlockedServers } from '../utils/cacheGetters/getAllBlockedServers.js'
import { getUnjointedPosts } from '../utils/baseQueryNew.js'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds.js'
import { getUserEmojis } from '../utils/cacheGetters/getUserEmojis.js'
import { getAtprotoUser } from '../atproto/utils/getAtprotoUser.js'
import { getAtProtoThread } from '../atproto/utils/getAtProtoThread.js'
import { logger } from '../utils/logger.js'
import { Privacy } from '../models/post.js'
export default function searchRoutes(app: Application) {
  app.get('/api/v2/search/', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    // const success = false;
    // eslint-disable-next-line max-len
    const searchTerm: string = (req.query.term || '').toString().toLowerCase().trim()
    // FUN FACT when searching remote posts you should not send the tolowercase thing lol
    const searchTermNoLowerCase: string = (req.query.term || '').toString().trim()
    let users: any = []
    let localUsers: any = []

    let postIds: string[] = []
    let remoteUsers: any = []
    let remotePost: any
    const promises: Array<Promise<any>> = []
    const posterId = req.jwtData ? req.jwtData.userId : '00000000-0000-0000-0000-000000000000'

    if (searchTerm) {
      const page = Number(req?.query.page) || 0
      let taggedPostsId = PostTag.findAll({
        where: sequelize.where(sequelize.fn('lower', sequelize.col('tagName')), searchTerm.toLowerCase()),
        include: [
          {
            model: Post,
            required: true,
            attributes: ['id', 'userId', 'privacy'],
            where: {
              [Op.or]: [
                {
                  privacy: { [Op.in]: [Privacy.Public, Privacy.LocalOnly] }
                },
                {
                  userId: {
                    [Op.in]: (await getFollowedsIds(posterId)).concat([posterId])
                  },
                  privacy: Privacy.FollowersOnly
                }
              ]
            }
          }
        ],
        attributes: ['postId'],
        order: [['createdAt', 'DESC']],
        limit: environment.postsPerPage,
        offset: page * environment.postsPerPage
      })
      promises.push(taggedPostsId)
      localUsers = User.findAll({
        limit: environment.postsPerPage,
        offset: page * environment.postsPerPage,
        where: {
          activated: true,
          hideProfileNotLoggedIn: false,
          [Op.and]: [
            {
              url: {
                [Op.notLike]: '@%'
              }
            },
            sequelize.literal(`lower("url") LIKE ${sequelize.escape('%' + searchTerm + '%')}`)
          ]
        },
        attributes: ['name', 'url', 'avatar', 'id', 'remoteId', 'description']
      })
      users = User.findAll({
        limit: environment.postsPerPage,
        offset: page * environment.postsPerPage,
        where: {
          activated: true,
          url: { [Op.like]: '@%' },
          federatedHostId: {
            [Op.notIn]: await getallBlockedServers()
          },
          banned: false,
          hideProfileNotLoggedIn: false,
          [Op.or]: [sequelize.literal(`lower("url") LIKE ${sequelize.escape('%' + searchTerm + '%')}`)]
        },
        attributes: ['name', 'url', 'avatar', 'id', 'remoteId', 'description']
      })
      promises.push(users)
      promises.push(localUsers)
      const usr = await User.findByPk(posterId)

      // remote user search time
      if (posterId !== '00000000-0000-0000-0000-000000000000' && page === 0) {
        if (searchTerm.split('@').length === 3 && searchTerm.split('@')[0] == '') {
          remoteUsers = searchRemoteUser(searchTerm.trim(), usr)
          promises.push(remoteUsers)
        }
        if (
          usr?.enableBsky &&
          searchTerm.split('@').length === 2 &&
          searchTerm.split('@')[0] == '' &&
          !searchTerm.split('@')[1].endsWith(environment.bskyPds)
        ) {
          remoteUsers = [await getAtprotoUser(searchTerm.split('@')[1], usr)]
        }
        const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/
        if (searchTerm.match(urlPattern)) {
          if (usr && usr.enableBsky && searchTerm.startsWith('https://bsky.app/profile/')) {
            try {
              // bluesky post
              const profileAndPost = searchTerm.split('https://bsky.app/profile/')[1].split('/post/')
              let bskyProfile = profileAndPost[0]
              let bskyUri = profileAndPost[1]
              if (!bskyProfile.startsWith('did:')) {
                let profileToGet = await getAtprotoUser(`${bskyProfile}`, usr)
                if (profileToGet && profileToGet.bskyDid) bskyProfile = profileToGet.bskyDid
              }
              const uri = `at://${bskyProfile}/app.bsky.feed.post/${bskyUri}`

              let bskyPostId = await getAtProtoThread(uri, undefined, true)
              if (bskyPostId) {
                remotePost = Post.findByPk(bskyPostId)
              }
            } catch (error) {
              logger.debug({
                message: `Error getting bluesky post ${searchTerm}`,
                error: error
              })
            }
          } else {
            // fedi post
            const existingPost = await Post.findOne({
              where: sequelize.where(sequelize.fn('lower', sequelize.col('remotePostId')), searchTerm.toLowerCase())
            })
            if (existingPost) {
              // We have the post. We ask for an update of it!
              remotePost = getPostThreadRecursive(usr, searchTermNoLowerCase, undefined, existingPost.id)
              promises.push(remotePost)
            } else {
              remotePost = getPostThreadRecursive(usr, searchTermNoLowerCase)
              promises.push(remotePost)
            }
          }
        }
      }

      await Promise.all(promises)
      remotePost = await remotePost
      if (remotePost && remotePost.id) {
        postIds.push(remotePost.id)
      }
      let taggedPostsIdValues = await taggedPostsId
      postIds = postIds.concat(taggedPostsIdValues.map((elem: any) => elem.postId))
    }

    const posts = await getUnjointedPosts(postIds, posterId, true)
    remoteUsers = await remoteUsers
    localUsers = await localUsers
    users = await users

    const foundUsers = [...remoteUsers, ...localUsers, ...users]
    const userIds = foundUsers.map((u: any) => u.id)
    const userEmojiIds = await UserEmojiRelation.findAll({
      attributes: ['emojiId', 'userId'],
      where: {
        userId: {
          [Op.in]: userIds
        }
      }
    })
    const emojiIds = userEmojiIds.map((e: any) => e.emojiId)
    const emojis = await Emoji.findAll({
      attributes: ['id', 'url', 'external', 'name'],
      where: {
        id: {
          [Op.in]: emojiIds
        }
      }
    })

    res.send({
      emojis,
      userEmojiIds,
      foundUsers,
      posts: posts
    })
  })

  app.get('/api/userSearch/:term', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const posterId = req.jwtData?.userId
    // const success = false;
    let users: any = []
    const searchTerm = req.params.term.toLowerCase().trim()
    users = User.findAll({
      limit: 20,
      where: {
        activated: true,
        [Op.and]: [sequelize.literal(`lower("url") LIKE ${sequelize.escape('@%' + searchTerm + '%')}`)],
        banned: {
          [Op.ne]: true
        },
        [Op.or]: [
          {
            federatedHostId: {
              [Op.notIn]: await getallBlockedServers()
            }
          },
          {
            federatedHostId: {
              [Op.eq]: null
            }
          }
        ]
      },
      attributes: ['url', 'avatar', 'id', 'remoteId']
    })

    let localUsers: any = User.findAll({
      limit: 20,
      where: {
        activated: true,
        [Op.and]: [
          {
            url: {
              [Op.notLike]: '@%'
            }
          },
          sequelize.literal(`lower("url") LIKE ${sequelize.escape('%' + searchTerm + '%')}`)
        ]
      },
      attributes: ['url', 'avatar', 'id', 'remoteId']
    })
    await Promise.all([localUsers, users])
    users = await users
    localUsers = await localUsers
    const result = localUsers
      .concat(users)
      .concat(await searchRemoteUser(searchTerm, await User.findOne({ where: { id: posterId } })))
    res.send({
      users: result
    })
  })
}

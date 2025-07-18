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
import { completeEnvironment } from '../utils/backendOptions.js'
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
        limit: completeEnvironment.postsPerPage,
        offset: page * completeEnvironment.postsPerPage
      })
      promises.push(taggedPostsId)
      localUsers = User.findAll({
        limit: completeEnvironment.postsPerPage,
        offset: page * completeEnvironment.postsPerPage,
        where: {
          activated: true,
          hideProfileNotLoggedIn: false,
          email: {
            [Op.ne]: null
          },
          url: {
            [Op.iLike]: `%${searchTerm}%`
          }
        },
        attributes: ['name', 'url', 'avatar', 'id', 'remoteId', 'description']
      })
      users = User.findAll({
        limit: completeEnvironment.postsPerPage,
        offset: page * completeEnvironment.postsPerPage,
        where: {
          activated: true,
          url: { [Op.iLike]: `%${searchTerm}%` },
          federatedHostId: {
            [Op.notIn]: await getallBlockedServers()
          },
          banned: false,
          hideProfileNotLoggedIn: false
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
        if (usr?.enableBsky && searchTerm.split('@').length === 2 && searchTerm.split('@')[0] == '') {
          try {
            remoteUsers = [await getAtprotoUser(searchTerm.split('@')[1], usr)]
          } catch (error) {
            logger.error({
              message: `Something went wrong while searching remote user`,
              error
            })
          }
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

    const foundUsers = [...remoteUsers, ...localUsers, ...users].filter((elem) => !!elem)
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
    const posterId = req.jwtData?.userId ? req.jwtData.userId : '00000000-0000-0000-0000-000000000000'
    // const success = false;
    let users: any = []
    const searchTerm = req.params.term.trim()
    users = await searchUsers(searchTerm, posterId, 0)
    res.send({
      users
    })
  })

  app.get('/api/v3/search', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const posterId = req.jwtData?.userId ? req.jwtData.userId : '00000000-0000-0000-0000-000000000000'
    // const success = false;
    const searchTerm = (req.query.term || '').toString().trim()
    const page = Number(req?.query.page) || 0

    let urlString = ''
    let postsIds: Promise<string[]> | string[] = []
    let users: Promise<User[]> | User[] = []

    try {
      urlString = new URL(searchTerm).href
    } catch (error) {}
    if (urlString && !page) {
      // we force fetch said remote post. Nothing eslse!
      const userPoster = await User.findByPk(posterId)
      if (userPoster) {
        if (
          userPoster.enableBsky &&
          urlString.toLowerCase().startsWith('https://bsky.app/profile/') &&
          urlString.toLowerCase().includes('/post/')
        ) {
          // BSKY POST
          try {
            const profileAndPost = urlString.split('https://bsky.app/profile/')[1].split('/post/')
            let bskyProfile = profileAndPost[0]
            let bskyUri = profileAndPost[1]
            if (!bskyProfile.startsWith('did:')) {
              let profileToGet = await getAtprotoUser(`${bskyProfile}`, userPoster)
              if (profileToGet && profileToGet.bskyDid) bskyProfile = profileToGet.bskyDid
            }
            const uri = `at://${bskyProfile}/app.bsky.feed.post/${bskyUri}`

            let bskyPostId = await getAtProtoThread(uri, undefined, true)
            if (bskyPostId) {
              postsIds = [bskyPostId]
            }
          } catch (error) {
            logger.debug({
              message: `Error in search obtaining bsky post ${searchTerm}`,
              error
            })
          }
        } else if (!urlString.toLowerCase().startsWith('https://bsky.app/profile/')) {
          // ok fedi post probably
          try {
            const remotePost = await getPostThreadRecursive(userPoster, urlString)
            if (remotePost) {
              await getPostThreadRecursive(userPoster, urlString, undefined, remotePost.id)
              postsIds = [remotePost.id]
            }
          } catch (error) {
            logger.debug({
              message: `Error in search obtaining fedi post ${searchTerm}`,
              error
            })
          }
        }
      }
    } else {
      users = searchUsers(searchTerm, posterId, page)
      postsIds = searchPosts(searchTerm, posterId, page)
    }

    await Promise.all([users, postsIds])
    users = await users
    postsIds = await postsIds
    const userEmojiIds = await UserEmojiRelation.findAll({
      attributes: ['emojiId', 'userId'],
      where: {
        userId: {
          [Op.in]: users.map((elem) => elem.id)
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
      foundUsers: users,
      posts: await getUnjointedPosts(postsIds, posterId, true)
    })
  })

  async function searchUsers(searchTerm: string, userId: string, page = 0): Promise<User[]> {
    let remoteMatch: Promise<User | null> | null = null
    let firstMatch = !page
      ? User.findOne({
          attributes: ['url', 'avatar', 'id', 'remoteId'],
          where: {
            activated: true,
            banned: {
              [Op.ne]: true
            },
            url: {
              [Op.iLike]: searchTerm
            }
          }
        })
      : null
    if (page == 0) {
      remoteMatch = searchUserFediAndbsky(searchTerm, (await User.findByPk(userId)) as User)
    }
    // we only start displaying remote users when we have finished with local users
    const localUsersCount = await User.count({
      where: {
        activated: true,
        banned: {
          [Op.ne]: true
        },
        email: {
          [Op.ne]: null
        },
        url: {
          [Op.iLike]: `%${searchTerm}%`
        }
      }
    })
    let localUsers =
      localUsersCount < (page + 1) * completeEnvironment.postsPerPage
        ? User.findAll({
            where: {
              activated: true,
              banned: {
                [Op.ne]: true
              },
              email: {
                [Op.ne]: null
              },
              url: {
                [Op.iLike]: `%${searchTerm}%`
              }
            },
            attributes: ['url', 'avatar', 'id', 'remoteId'],
            order: [['createdAt', 'DESC']],
            limit: completeEnvironment.postsPerPage,
            offset: page * completeEnvironment.postsPerPage
          })
        : []
    const remoteUsersPage = page - Math.floor(localUsersCount / completeEnvironment.postsPerPage)
    let remoteUsers =
      remoteUsersPage >= 0
        ? User.findAll({
            where: {
              activated: true,
              banned: {
                [Op.ne]: true
              },
              url: {
                [Op.iLike]: `@%${searchTerm}%`
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
            attributes: ['url', 'avatar', 'id', 'remoteId', 'federatedHostId'],
            order: [['createdAt', 'DESC']],
            limit: completeEnvironment.postsPerPage,
            offset: remoteUsersPage * completeEnvironment.postsPerPage
          })
        : []

    await Promise.all([firstMatch, localUsers, remoteUsers, remoteMatch])
    if (await remoteMatch) {
      firstMatch = remoteMatch
    }
    let res: User[] = []
    if (await firstMatch) {
      res.push((await firstMatch) as User)
    }
    res = res.concat(await localUsers)
    if ((await remoteUsers) && (await remoteUsers).length >= 1) {
      let tmpRemote = await remoteUsers
      res = res.concat(tmpRemote as User[])
    }
    return res
  }

  async function searchUserFediAndbsky(searchTermIncomplete: string, usr: User): Promise<User | null> {
    // WILL ALWAYS ADD INITIAL @ SO WE CAN AUTOCOMPLETE ON POST EDITOR
    // search exact url match and forces update in local db.
    // only search in bsky if user has enabed bsky
    const searchTerm = searchTermIncomplete.startsWith('@') ? searchTermIncomplete : `@${searchTermIncomplete}`
    const searchTermSplitted = searchTerm.split('@')
    let result: User | null = null

    if (usr.enableBsky && searchTermSplitted.length === 2 && searchTermSplitted[0] == '') {
      const bskySearchResult = await getAtprotoUser(searchTerm.split('@')[1], usr)
      if (bskySearchResult && bskySearchResult.url != completeEnvironment.deletedUser) {
        result = bskySearchResult
      }
    }

    // we have a full @fediUser@fediServer url. Time to search!
    if (!result && searchTermSplitted.length === 3) {
      result = await searchRemoteUser(searchTerm, usr)
    }
    return result
  }

  // this method will only search posts in the database localy, not remote petitions
  // petitions of remote posts shall be done in the search endpoint itself
  async function searchPosts(searchTerm: string, userId: string, page = 0): Promise<string[]> {
    let res: string[] = []
    const followedUsers = (await getFollowedsIds(userId)).concat([userId])
    const totalPostExactMatch = await PostTag.count({
      where: {
        tagName: {
          [Op.iLike]: searchTerm
        }
      },
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
                  [Op.in]: followedUsers
                },
                privacy: Privacy.FollowersOnly
              }
            ]
          }
        }
      ]
    })
    let completeMatch: Promise<PostTag[]> | PostTag[] | null = null
    let looseMatch: Promise<PostTag[]> | PostTag[] | null = null

    if (totalPostExactMatch < (page + 1) * completeEnvironment.postsPerPage) {
      completeMatch = PostTag.findAll({
        where: {
          tagName: {
            [Op.iLike]: searchTerm
          }
        },
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
                    [Op.in]: followedUsers
                  },
                  privacy: Privacy.FollowersOnly
                }
              ]
            }
          }
        ],
        attributes: ['postId'],
        order: [['createdAt', 'DESC']],
        limit: completeEnvironment.postsPerPage,
        offset: page * completeEnvironment.postsPerPage
      })
    }
    const looseSearchPage = page - Math.floor(totalPostExactMatch / completeEnvironment.postsPerPage)
    if (looseSearchPage >= 0) {
      looseMatch = PostTag.findAll({
        where: {
          tagName: {
            [Op.iLike]: '%' + searchTerm + '%',
            [Op.notILike]: searchTerm
          }
        },
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
                    [Op.in]: followedUsers
                  },
                  privacy: Privacy.FollowersOnly
                }
              ]
            }
          }
        ],
        attributes: ['postId'],
        order: [['createdAt', 'DESC']],
        limit: completeEnvironment.postsPerPage,
        offset: looseSearchPage * completeEnvironment.postsPerPage
      })
    }
    await Promise.all([completeMatch, looseMatch])
    completeMatch = await completeMatch
    looseMatch = await looseMatch
    if (completeMatch && completeMatch.length > 0) {
      res = res.concat(completeMatch.map((elem) => elem.postId))
    }
    if (looseMatch && looseMatch.length > 0) {
      res = res.concat(looseMatch.map((elem) => elem.postId))
    }
    return res
  }
}

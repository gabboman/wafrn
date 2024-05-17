import { Application, Response } from 'express'
import { Op, Sequelize } from 'sequelize'
import { Post, PostTag, User } from '../db'
import { sequelize } from '../db'

import getStartScrollParam from '../utils/getStartScrollParam'
import getPosstGroupDetails from '../utils/getPostGroupDetails'
import optionalAuthentication from '../utils/optionalAuthentication'
import { authenticateToken } from '../utils/authenticateToken'

import { searchRemoteUser } from '../utils/activitypub/searchRemoteUser'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { environment } from '../environment'
import { getPostThreadRecursive } from '../utils/activitypub/getPostThreadRecursive'
import checkIpBlocked from '../utils/checkIpBlocked'
import { getAllLocalUserIds } from '../utils/cacheGetters/getAllLocalUserIds'
import { getallBlockedServers } from '../utils/cacheGetters/getAllBlockedServers'
import { getUnjointedPosts } from '../utils/baseQueryNew'
export default function searchRoutes(app: Application) {
  app.get('/api/v2/search/', checkIpBlocked, optionalAuthentication, async (req: AuthorizedRequest, res: Response) => {
    // const success = false;
    // eslint-disable-next-line max-len
    const searchTerm: string = (req.query.term || '').toString().toLowerCase().trim()
    let users: any = []
    let localUsers: any = []

    let postIds: string[] = []
    let remoteUsers: any = []
    let remotePost: any
    const promises: Array<Promise<any>> = []
    const posterId = req.jwtData ? req.jwtData.userId : 'NOT-LOGGED-IN'

    if (searchTerm) {
      const page = Number(req?.query.page) || 0
      let taggedPostsId = PostTag.findAll({
        where: {
          tagName: {
            [Op.like]: `%${searchTerm}%`
          }
        },
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
          [Op.and]: [
            {
              url: {
                [Op.notLike]: '@%'
              }
            },
            [sequelize.where(sequelize.fn('LOWER', sequelize.col('url')), 'LIKE', `%${searchTerm}%`)]
          ]
        },
        attributes: ['url', 'avatar', 'id', 'remoteId', 'description']
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
          [Op.or]: [sequelize.where(sequelize.fn('LOWER', sequelize.col('url')), 'LIKE', `%${searchTerm}%`)]
        },
        attributes: ['url', 'avatar', 'id', 'remoteId', 'description']
      })
      promises.push(users)
      promises.push(localUsers)
      const usr = await User.findByPk(posterId)

      // remote user search time
      if (posterId !== 'NOT-LOGGED-IN' && page === 0) {
        if (searchTerm.split('@').length === 3) {
          remoteUsers = searchRemoteUser(searchTerm, usr)
          promises.push(remoteUsers)
        }
        const urlPattern = /(?:https?):\/\/(\w+:?\w*)?(\S+)(:\d+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/
        if (searchTerm.match(urlPattern)) {
          remotePost = getPostThreadRecursive(usr, searchTerm)
          promises.push(remotePost)
        }
      }

      await Promise.all(promises)
      remotePost = await remotePost
      if (remotePost && remotePost.id) {
        postIds.push(remotePost.id)
      }
      taggedPostsId = await taggedPostsId
      postIds = postIds.concat(taggedPostsId.map((elem: any) => elem.postId))
    }

    const posts = await getUnjointedPosts(postIds, posterId)
    remoteUsers = await remoteUsers
    localUsers = await localUsers
    users = await users

    res.send({
      foundUsers: remoteUsers.concat(localUsers).concat(users),
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
        url: { [Op.like]: '@%' },
        federatedHostId: {
          [Op.notIn]: await getallBlockedServers()
        },
        banned: false,
        [Op.or]: [sequelize.where(sequelize.fn('LOWER', sequelize.col('url')), 'LIKE', `%${searchTerm}%`)]
      },
      attributes: ['url', 'avatar', 'id', 'remoteId']
    })

    let localUsers = User.findAll({
      limit: 20,
      where: {
        activated: true,
        [Op.and]: [
          {
            url: {
              [Op.notLike]: '@%'
            }
          },
          [sequelize.where(sequelize.fn('LOWER', sequelize.col('url')), 'LIKE', `%${searchTerm}%`)]
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

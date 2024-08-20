// This file will use the new and improved api that returns more stuff
// it does more queries but it should be more efficient
// the MONSTER QUERY we are using now doesnt scale well on threads with lots of users

import { Application, Response } from 'express'
import { authenticateToken } from '../utils/authenticateToken'
import optionalAuthentication from '../utils/optionalAuthentication'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { Post, PostMentionsUserRelation } from '../db'
import { Op } from 'sequelize'
import getStartScrollParam from '../utils/getStartScrollParam'
import { environment } from '../environment'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds'
import getNonFollowedLocalUsersIds from '../utils/cacheGetters/getNotFollowedLocalUsersIds'
import getBlockedIds from '../utils/cacheGetters/getBlockedIds'
import { getUnjointedPosts } from '../utils/baseQueryNew'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts'
import { navigationRateLimiter } from '../utils/rateLimiters'

export default function dashboardRoutes(app: Application) {
  app.get(
    '/api/v2/dashboard',
    optionalAuthentication,
    navigationRateLimiter,
    async (req: AuthorizedRequest, res: Response) => {
      const level = parseInt(req.query.level as string) // level of dashboard: localExplore, explore, dashboard or DMs
      const posterId = req.jwtData?.userId ? req.jwtData?.userId : '00000000-0000-0000-0000-000000000000'
      const POSTS_PER_PAGE = environment.postsPerPage

      // level: 0 explore 1 dashboard 2 localExplore 10 dms
      if (level !== 2 && posterId === '00000000-0000-0000-0000-000000000000') {
        res.sendStatus(401)
        return
      }

      let whereObject: any = {
        privacy: 0
      }
      switch (level) {
        case 2: {
          const followedUsers = getFollowedsIds(posterId, true)
          const nonFollowedUsers = getNonFollowedLocalUsersIds(posterId)
          whereObject = {
            [Op.or]: [
              {
                //local follows privacy 0 1 2
                privacy: {
                  [Op.in]: [0, 1, 2, 3]
                },
                userId: {
                  [Op.in]: await followedUsers
                }
              },
              {
                privacy: {
                  [Op.in]: req.jwtData?.userId ? [0, 2, 3] : [0] // only display public if not logged in
                },
                userId: {
                  [Op.in]: await nonFollowedUsers
                }
              }
            ]
          }
          break
        }
        case 1: {
          whereObject = {
            privacy: { [Op.in]: [0, 1, 2, 3] },
            userId: { [Op.in]: await getFollowedsIds(posterId) }
          }
          break
        }
        case 0: {
          whereObject = {
            privacy: 0,
            content: {
              [Op.ne]: ''
            }
          }
          break
        }
        case 10: {
          // we get the list of posts twice woopsie. Should fix but this way is not going to be "that much"
          const dms = await PostMentionsUserRelation.findAll({
            order: [['createdAt', 'DESC']],
            limit: POSTS_PER_PAGE,
            where: {
              userId: posterId,
              createdAt: { [Op.lt]: getStartScrollParam(req) }
            }
          })

          const myPosts = await Post.findAll({
            where: {
              userId: posterId,
              privacy: 10,
              createdAt: {
                [Op.lt]: getStartScrollParam(req)
              }
            }
          })

          whereObject = {
            privacy: 10,
            [Op.or]: [
              {
                id: {
                  [Op.in]: dms.map((pst: any) => pst.postId).concat(myPosts.map((pst: any) => pst.id)) //latestMentionedPosts.map((elem: any) => elem.id)
                },
                userId: {
                  [Op.notIn]: await getBlockedIds(posterId)
                }
              }
            ]
          }
          break
        }
        case 25: {
          whereObject = {
            id: {
              [Op.in]: await getMutedPosts(posterId)
            }
          }
        }
      }
      // we get the list of posts
      const postIds = await Post.findAll({
        order: [['createdAt', 'DESC']],
        limit: POSTS_PER_PAGE,
        attributes: ['id'],
        where: {
          createdAt: { [Op.lt]: getStartScrollParam(req) },
          ...whereObject
        }
      })

      res.send(
        await getUnjointedPosts(
          postIds.map((elem: any) => elem.id),
          posterId
        )
      )
    }
  )
}

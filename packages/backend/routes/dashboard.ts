// This file will use the new and improved api that returns more stuff
// it does more queries but it should be more efficient
// the MONSTER QUERY we are using now doesnt scale well on threads with lots of users

import { Application, Response } from 'express'
import optionalAuthentication from '../utils/optionalAuthentication.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { FederatedHost, Post, PostMentionsUserRelation, PostTag, sequelize, User } from '../models/index.js'
import { Op } from 'sequelize'
import getStartScrollParam from '../utils/getStartScrollParam.js'
import { environment } from '../environment.js'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds.js'
import getNonFollowedLocalUsersIds from '../utils/cacheGetters/getNotFollowedLocalUsersIds.js'
import getBlockedIds from '../utils/cacheGetters/getBlockedIds.js'
import { getUnjointedPosts } from '../utils/baseQueryNew.js'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts.js'
import { navigationRateLimiter } from '../utils/rateLimiters.js'
import { Privacy } from '../models/post.js'

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
        privacy: Privacy.Public
      }
      switch (level) {
        case 2: {
          const followedUsers = getFollowedsIds(posterId, true)
          const nonFollowedUsers = getNonFollowedLocalUsersIds(posterId)
          whereObject = {
            [Op.or]: [
              {
                privacy: {
                  [Op.in]: [Privacy.Public, Privacy.FollowersOnly, Privacy.LocalOnly]
                },
                userId: {
                  [Op.in]: await followedUsers
                }
              },
              {
                privacy: {
                  [Op.in]: req.jwtData?.userId ? [Privacy.Public, Privacy.LocalOnly] : [Privacy.Public] // only display public if not logged in
                },
                userId: {
                  [Op.in]: await nonFollowedUsers
                }
              },
              {
                userId: posterId,
                privacy: {
                  [Op.ne]: Privacy.DirectMessage
                }
              }
            ]
          }
          break
        }
        case 1: {
          const orConditions: any = [
            {
              userId: { [Op.in]: await getFollowedsIds(posterId) }
            }
          ]
          const subscribedTags = ['waffle feature']
          if (subscribedTags && subscribedTags.length > 0) {
            orConditions.push({
              privacy: 0,
              '$postTags.tagName$': {
                [Op.in]: subscribedTags
              }
            })
          }
          whereObject = {
            privacy: { [Op.in]: [Privacy.Public, Privacy.FollowersOnly, Privacy.LocalOnly, Privacy.Unlisted] },
            [Op.or]: orConditions
          }
          break
        }
        case 0: {
          whereObject = {
            privacy: Privacy.Public,
            isReblog: false,
            '$user.federatedHost.bubbleTimeline$': true
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

          const lastDmDate: Date = dms.length > 0 ? new Date(dms[dms.length - 1].createdAt) : new Date(0)
          const myPosts = await Post.findAll({
            // TODO fix this! there is a THEORETICAL posibility of something going wrong. using all user dms can be too much but just get them between here and last post...
            order: [['createdAt', 'DESC']],
            limit: POSTS_PER_PAGE * 10,
            where: {
              userId: posterId,
              privacy: Privacy.DirectMessage,
              createdAt: {
                [Op.lt]: getStartScrollParam(req)
              }
            }
          })

          whereObject = {
            privacy: Privacy.DirectMessage,
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
          break
        }
        case 50: {
          // bookmarked posts
          whereObject = {
            literal: sequelize.literal(
              `"posts"."id" IN (SELECT "postId" FROM "userBookmarkedPosts" WHERE "userId"='${posterId}')`
            )
          }
        }
      }
      // we get the list of posts
      const postIds = await Post.findAll({
        include: [
          {
            model: PostTag,
            required: false
          },
          {
            model: User,
            as: 'user',
            required: true,
            include: [
              {
                model: FederatedHost,
                required: false
              }
            ]
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: POSTS_PER_PAGE,
        attributes: ['id', 'createdAt'],
        subQuery: false,
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

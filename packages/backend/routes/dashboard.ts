// This file will use the new and improved api that returns more stuff
// it does more queries but it should be more efficient
// the MONSTER QUERY we are using now doesnt scale well on threads with lots of users

import { Application, Response } from 'express'
import { authenticateToken } from '../utils/authenticateToken'
import optionalAuthentication from '../utils/optionalAuthentication'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import {
  Emoji,
  EmojiReaction,
  Media,
  Post,
  PostEmojiRelations,
  PostMediaRelations,
  PostMentionsUserRelation,
  PostTag,
  QuestionPoll,
  QuestionPollAnswer,
  QuestionPollQuestion,
  User,
  UserEmojiRelation,
  UserLikesPostRelations
} from '../db'
import { Op } from 'sequelize'
import getStartScrollParam from '../utils/getStartScrollParam'
import { environment } from '../environment'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds'
import getNonFollowedLocalUsersIds from '../utils/cacheGetters/getNotFollowedLocalUsersIds'
import getBlockedIds from '../utils/cacheGetters/getBlockedIds'
import getPosstGroupDetails from '../utils/getPostGroupDetails'
import { getUnjointedPosts } from '../utils/baseQueryNew'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts'

export default function dashboardRoutes(app: Application) {
  app.get('/api/v2/dashboard', optionalAuthentication, async (req: AuthorizedRequest, res: Response) => {
    const level = parseInt(req.query.level as string) // level of dashboard: localExplore, explore, dashboard or DMs
    const posterId = req.jwtData?.userId ? req.jwtData?.userId : 'NOT-LOGGED-IN'
    const POSTS_PER_PAGE = environment.postsPerPage

    // level: 0 explore 1 dashboard 2 localExplore 10 dms
    if (level !== 2 && posterId === 'NOT-LOGGED-IN') {
      res.sendStatus(403)
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
                [Op.in]: [0, 2, 3]
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
          privacy: 0
        }
        break
      }
      case 10: {
        // we get the list of posts twice woopsie. Should fix but this way is not going to be "that much"
        const dms = await Post.findAll({
          order: [['createdAt', 'DESC']],
          limit: POSTS_PER_PAGE,
          include: [
            {
              model: User,
              as: 'mentionPost',
              where: {
                id: posterId
              },
              attributes: []
            }
          ],
          where: {
            privacy: 10,
            createdAt: { [Op.lt]: getStartScrollParam(req) }
          }
        })

        whereObject = {
          privacy: 10,
          [Op.or]: [
            {
              id: {
                [Op.in]: dms.map((pst: any) => pst.id) //latestMentionedPosts.map((elem: any) => elem.id)
              },
              userId: {
                [Op.notIn]: await getBlockedIds(posterId)
              }
            },
            {
              userId: posterId
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
  })
}

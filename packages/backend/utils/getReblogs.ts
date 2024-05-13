import { Op } from 'sequelize'
import { Post, User } from '../db'
import { logger } from './logger'

export default async function getReblogs(user: any) {
  const userId = user.id
  const userPostsWithReblogs = await Post.findAll({
    include: [
      {
        model: Post,
        as: 'descendents',
        where: {
          createdAt: {
            [Op.gt]: new Date(user.lastTimeNotificationsCheck)
          }
        },
        include: [
          {
            model: User,
            attributes: ['avatar', 'url', 'description', 'id']
          }
        ]
      },
      {
        model: User,
        attributes: ['avatar', 'url', 'description']
      }
    ],
    where: {
      userId
    }
  })
  const result: any[] = []
  userPostsWithReblogs.forEach((postWithReblogs: any) => {
    try {
      postWithReblogs.descendents.forEach((elem: any) => {
        // TODO fix dirty hack
        const elemProcessed: any = JSON.parse(JSON.stringify(elem))
        elemProcessed.createdAt = elem.createdAt.getTime()
        result.push(elemProcessed)
      })
    } catch (error) {
      logger.error(error)
    }
  })
  return result
}

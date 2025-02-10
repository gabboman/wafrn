import { Op } from 'sequelize'
import { getAllLocalUserIds } from '../cacheGetters/getAllLocalUserIds.js'
import { Post, User } from '../../db.js'

const localUserIds = await getAllLocalUserIds()

const localUsers = await User.findAll({
  where: {
    id: {
      [Op.in]: localUserIds
    }
  }
})

for await (const user of localUsers) {
  console.log('updating ' + user.url)
  const latestPost = await Post.findOne({
    where: {
      userId: user.id
    },
    order: [['createdAt', 'DESC']]
  })
  if (latestPost) {
    user.lastActiveAt = latestPost.createdAt
    await user.save()
  }
}

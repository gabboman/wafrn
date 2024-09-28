import { Op } from 'sequelize'
import { Follows } from '../../db.js'
import { getAllLocalUserIds } from '../cacheGetters/getAllLocalUserIds'
import { acceptRemoteFollow } from '../activitypub/acceptRemoteFollow'

async function fix() {
  const localUsers = await getAllLocalUserIds()
  console.log(localUsers)
  const follows = await Follows.findAll({
    where: {
      accepted: true,
      followedId: {
        [Op.in]: localUsers
      },
      followerId: {
        [Op.notIn]: localUsers
      }
    }
  })
  for await (const follow of follows) {
    try {
      await acceptRemoteFollow(follow.followedId, follow.followerId)
      console.log(`user ${follow.followedId} followed ${follow.followerId}`)
    } catch (error) {
      console.log(error)
    }
  }
}

fix().then(() => {
  console.log('done')
})

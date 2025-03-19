import { Op } from 'sequelize'
import { Follows, sequelize, User } from '../../../db.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { getAllLocalUserIds } from '../../cacheGetters/getAllLocalUserIds.js'
import { follow } from '../../follow.js'
import { logger } from '../../logger.js'
import { getRemoteActor } from '../getRemoteActor.js'

async function MoveActivity(body: activityPubObject, remoteUser: any, user: any) {
  // WIP move
  // TODO get list of users who where following old account
  // then make them follow the new one, sending petition
  const apObject: activityPubObject = body
  logger.warn({ message: 'moving user', object: apObject })
  const newUser = await getRemoteActor(apObject.target, user)
  const oldUser = await User.findByPk(remoteUser.id) // a bit paranoid, innit?
  if (newUser && oldUser) {
    logger.debug({ message: `Moving ${oldUser.url} to ${newUser.url}` })
    const followsToMove = await Follows.findAll({
      where: {
        followedId: oldUser.id,
        accepted: true,
        followerId: { [Op.in]: await getAllLocalUserIds() },
        literal: sequelize.literal(
          `"followerId" NOT IN (select "followerId" from "follows" where "followedId"='${newUser.id}')`
        )
      }
    })
    if (followsToMove) {
      logger.debug({ message: `Moving ${oldUser.url} to ${newUser.url}: ${followsToMove.length} follows to move` })
      for await (const followToMove of followsToMove) {
        await follow(followToMove.followerId, newUser.id)
      }
    }
  }
}

export { MoveActivity }

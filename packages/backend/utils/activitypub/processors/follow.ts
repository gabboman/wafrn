import { Follows, Notification, User } from '../../../models/index.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { createNotification } from '../../pushNotifications.js'
import { acceptRemoteFollow } from '../acceptRemoteFollow.js'
import { getRemoteActor } from '../getRemoteActor.js'
import { signAndAccept } from '../signAndAccept.js'

async function FollowActivity(body: activityPubObject, remoteUser: User, user: User) {
  const apObject: activityPubObject = body
  // Follow user
  const userToBeFollowed = await getRemoteActor(apObject.object, user)
  if (userToBeFollowed) {
    let [remoteFollow, created] = await Follows.findOrCreate({
      where: {
        followerId: remoteUser.id,
        followedId: userToBeFollowed.id
      },
      defaults: {
        followerId: remoteUser.id,
        followedId: userToBeFollowed.id,
        remoteFollowId: apObject.id,
        accepted: userToBeFollowed.url.startsWith('@') ? true : !userToBeFollowed.manuallyAcceptsFollows,
        muteQuotes: false,
        muteRewoots: false
      }
    })
    // we accept it if user accepts follows automaticaly
    if (remoteFollow.accepted && created) {
      createNotification(
        {
          notificationType: 'FOLLOW',
          userId: remoteUser.id,
          notifiedUserId: userToBeFollowed.id
        },
        {
          userUrl: remoteUser.url
        }
      )
      await acceptRemoteFollow(userToBeFollowed.id, remoteUser.id)
    }
  }
}

export { FollowActivity }

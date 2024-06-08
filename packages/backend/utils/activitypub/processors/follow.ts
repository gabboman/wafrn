import { Follows } from '../../../db'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { getRemoteActor } from '../getRemoteActor'
import { signAndAccept } from '../signAndAccept'

async function FollowActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  // Follow user
  const userToBeFollowed = await getRemoteActor(apObject.object, user)
  let remoteFollow = await Follows.findOne({
    where: {
      followerId: remoteUser.id,
      followedId: userToBeFollowed.id
    }
  })
  if (!remoteFollow) {
    remoteFollow = await Follows.create({
      followerId: remoteUser.id,
      followedId: userToBeFollowed.id,
      remoteFollowId: apObject.id,
      accepted: userToBeFollowed.url.startsWith('@') ? true : !userToBeFollowed.manuallyAcceptsFollows
    })
  }
  remoteFollow.save()
  // we accept it
  if (remoteFollow.accepted) {
    await signAndAccept({ body: body }, remoteUser, user)
  }
}

export { FollowActivity }

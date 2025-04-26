import { activityPubObject } from '../../interfaces/fediverse/activityPubObject.js'
import { Privacy, PrivacyType } from '../../models/post.js'

function getApObjectPrivacy(apObject: activityPubObject, remoteUser: any): PrivacyType {
  let privacy: PrivacyType = Privacy.DirectMessage
  if (
    apObject.to &&
    (apObject.to[0]?.toString().includes(remoteUser.followersCollectionUrl) ||
      apObject.to[0]?.toString().includes('follow') ||
      apObject.to.includes(remoteUser.followersCollectionUrl) ||
      apObject.to.includes('follow'))
  ) {
    privacy = Privacy.FollowersOnly
  }
  if (apObject.cc && (apObject.cc.includes('https://www.w3.org/ns/activitystreams#Public') || apObject.cc.includes('as:Public'))) {
    // unlisted
    privacy = Privacy.Unlisted
  }
  if (apObject.to && (apObject.to.includes('https://www.w3.org/ns/activitystreams#Public') || apObject.to.includes('as:Public'))) {
    // post is PUBLIC
    privacy = Privacy.Public
  }
  if (remoteUser.isBot) {
    privacy = privacy >= Privacy.Unlisted ? privacy : Privacy.Unlisted
  }

  return privacy
}

export { getApObjectPrivacy }

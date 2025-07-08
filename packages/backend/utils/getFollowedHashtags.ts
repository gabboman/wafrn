import { UserFollowHashtag } from '../models/userFollowHashtag.js'

async function getFollowedHashtags(userId: string): Promise<string[]> {
  // TODO? Use redis for this.
  const hashtags = await UserFollowHashtag.findAll({ where: { userId: userId } })
  return hashtags.map((elem) => elem.tagName).filter((elem) => !!elem)
}

export { getFollowedHashtags }

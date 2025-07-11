import { UserFollowHashtags } from '../models/userFollowHashtag.js'

async function getFollowedHashtags(userId: string): Promise<string[]> {
  // TODO? Use redis for this.
  const hashtags = await UserFollowHashtags.findAll({ where: { userId: userId } })
  return hashtags
    .map((elem) => elem.tagName)
    .filter((elem) => !!elem)
    .map((elem) => elem.toLowerCase())
}

export { getFollowedHashtags }

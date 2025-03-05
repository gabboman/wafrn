import { ParsedCommit } from '@skyware/firehose'
import { Post } from '../../db.js'
import { Op, Sequelize } from 'sequelize'
import { getLocalUserId } from '../../utils/cacheGetters/getLocalUserId.js'
import { getAllLocalUserIds } from '../../utils/cacheGetters/getAllLocalUserIds.js'

// Preemptive checks to see if
function checkCommitMentions(
  commit: ParsedCommit,
  cacheData: { followedDids: string[]; localUserDids: string[]; followedUsersLocalIds: string[] }
): boolean {
  const didsToCheck = [...new Set(cacheData.localUserDids.concat(cacheData.followedDids))]

  let res = false
  // first we check if there are any mentions to local users. if so we return true
  for (const operation of commit.ops) {
    // we check lik
    if (
      operation.action === 'create' &&
      (operation.path.startsWith('app.bsky.feed.like') || operation.path.startsWith('app.bsky.graph.follow'))
    ) {
      // we do not ned 18k likes on a mark hamill post. We better do just a "people you follow liked..."
      const likedPostUri = operation.record?.subject?.uri ? operation.record.subject.uri : ''
      const followedUser = operation.path.startsWith('app.bsky.graph.follow') ? operation.record.subject : ''
      if (
        didsToCheck.some((elem) => elem == commit.repo) ||
        cacheData.localUserDids.some((elem) => likedPostUri.includes(elem) || elem === followedUser)
      ) {
        return true
      }
    }
    if (operation.action === 'create' && operation.path.startsWith('app.bsky.feed.post') && operation.record.facets) {
      const mentions = operation.record.facets
        .flatMap((elem) => elem.features)
        .map((elem) => elem.did)
        .filter((elem) => elem)
      if (mentions && mentions.length && mentions.some((mention: string) => didsToCheck.includes(mention))) {
        res = true
        return res
      }
    }
  }
  // second one first approach: is post being replied on db? if so we store it.
  const urisToCheck: string[] = commit.ops
    .filter((op) => op.action === 'create' && op.path.startsWith('app.bsky.feed.post') && op.record?.reply)
    .map((op) => {
      return { parent: op.record.reply.parent.uri, root: op.record.reply.root.uri }
    })
    .map((elem) => [elem.parent, elem.root])
    .flat()
    .map((elem) => elem.split('at://')[1])
    .map((elem) => elem.split('/app.bsky.feed')[0])
  let postsFounds = 0

  if (urisToCheck.length > 0) {
    postsFounds = urisToCheck.some((elem) => didsToCheck.includes(elem)) ? 1 : postsFounds
  }

  if (postsFounds > 0) {
    res = true
  }
  return res
}

export { checkCommitMentions }

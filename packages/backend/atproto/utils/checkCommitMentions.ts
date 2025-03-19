import { ParsedCommit } from '@skyware/firehose'
import { Post } from '../../db.js'
import { Op, Sequelize } from 'sequelize'
import { getLocalUserId } from '../../utils/cacheGetters/getLocalUserId.js'
import { getAllLocalUserIds } from '../../utils/cacheGetters/getAllLocalUserIds.js'

// Preemptive checks to see if
function checkCommitMentions(
  commit: ParsedCommit,
  cacheData: { followedDids: Set<string>; localUserDids: Set<string>; followedUsersLocalIds: Set<string> }
): boolean {
  const didsToCheck = cacheData.followedDids

  let res = false
  // first we check if there are any mentions to local users. if so we return true
  for (const operation of commit.ops) {
    // TODO nuke this
    if (operation.path.startsWith('app.bsky.feed.like')) {
      return false
    }
    // we check lik
    if (
      operation.action === 'create' &&
      (operation.path.startsWith('app.bsky.feed.like') || operation.path.startsWith('app.bsky.graph.follow'))
    ) {
      // we do not ned 18k likes on a mark hamill post. We better do just a "people you follow liked..."
      let likedPostUri = operation.record?.subject?.uri ? operation.record.subject.uri : ''
      if (likedPostUri) {
        likedPostUri = likedPostUri.split('/')[2]
      }
      let followedUser = operation.path.startsWith('app.bsky.graph.follow') ? operation.record.subject : ''

      if (
        didsToCheck.has(commit.repo) ||
        cacheData.localUserDids.has(likedPostUri) ||
        cacheData.localUserDids.has(followedUser)
      ) {
        return true
      }
    }
    if (operation.action === 'create' && operation.path.startsWith('app.bsky.feed.post') && operation.record.facets) {
      const mentions = operation.record.facets
        .flatMap((elem) => elem.features)
        .map((elem) => elem.did)
        .filter((elem) => elem)
      if (mentions && mentions.length && mentions.some((mention: string) => cacheData.localUserDids.has(mention))) {
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
    // TODO oh no lets lower the thing a bit
    // postsFounds = urisToCheck.some((elem) => didsToCheck.has(elem)) ? 1 : postsFounds
    postsFounds = urisToCheck.some((elem) => cacheData.localUserDids.has(elem)) ? 1 : postsFounds
  }

  if (postsFounds > 0) {
    res = true
  }
  return res
}

export { checkCommitMentions }

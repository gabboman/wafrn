import { ParsedCommit } from "@skyware/firehose";
import { Post } from "../../db.js";
import { Op, Sequelize } from "sequelize";
import { getLocalUserId } from "../../utils/cacheGetters/getLocalUserId.js";
import { getAllLocalUserIds } from "../../utils/cacheGetters/getAllLocalUserIds.js";

// Preemptive checks to see if
async function checkCommitMentions(commit: ParsedCommit, cacheData: { followedDids: string[], localUserDids: string[], followedUsersLocalIds: string[] }): Promise<boolean> {
  const didsToCheck = [... new Set(cacheData.localUserDids.concat(cacheData.followedDids))];
  const followedUsersLocalIds = cacheData.followedUsersLocalIds

  let res = false;
  // first we check if there are any mentions to local users. if so we return true
  for (const operation of commit.ops) {
    // we check lik
    if (operation.action === 'create' && operation.path.startsWith('app.bsky.feed.like')) {
      if (didsToCheck.some(elem => operation.record.subject.uri.includes(elem))) {
        return true;
      }
    }
    if (operation.action === 'create' && operation.path.startsWith('app.bsky.feed.post') && operation.record.facets) {
      const mentions = operation.record.facets.flatMap(elem => elem.features).map(elem => elem.did).filter(elem => elem)
      if (mentions && mentions.length && mentions.some(mention => didsToCheck.includes(mention))) {
        res = true;
        return res;
      }
    }
  }
  // second one first approach: is post being replied on db? if so we store it.
  const urisToCheck: string[] = commit.ops.filter(op => op.action === 'create' && op.path.startsWith('app.bsky.feed.post') && op.record?.reply).map(op => { return { parent: op.record.reply.parent.uri, root: op.record.reply.root.uri } }).map(elem => [elem.parent, elem.root]).flat().map(elem => elem.split('at://')[1]).map(elem => elem.split('/app.bsky.feed')[0])
  let postsFounds = 0;


  if (urisToCheck.length > 0) {
    postsFounds = urisToCheck.some(elem => didsToCheck.includes(elem)) ? 1 : 0
    /*
    // if post starts with uri of any of our users it must be in reply to one of our users!
    if (urisToCheck.map(elem => elem.split('/app.bsky.feed.post/')[0]).some(elem => didsToCheck.includes(elem))) {
      return true;
    }
    const existingPostInDb = await Post.findOne({
      include: [{
        model: Post,
        as: 'ancestors'
      }],
      where: {
        bskyUri: {
          [Op.in]: urisToCheck
        }
      }
    })
    if (existingPostInDb) {
      const localUsers = await getAllLocalUserIds();
      const userIds = [existingPostInDb.userId, ...existingPostInDb.ancestors.map(elem => elem.userId)].concat(followedUsersLocalIds)
      const postInReplyToLocalUserOrFollowedUser = userIds.some(usrId => localUsers.includes(usrId))
      postsFounds = postInReplyToLocalUserOrFollowedUser ? 1 : 0
    }
    */
  }

  if (postsFounds > 0) {
    res = true;
  }
  return res;
}


export { checkCommitMentions }

import {ParsedCommit} from "@skyware/firehose";
import {Post} from "../../db.js";
import {Op} from "sequelize";

// Preemptive checks to see if
async function checkCommitMentions(commit: ParsedCommit, didsToCheck: string[]): Promise<boolean> {


  let res = false;
  // first we check if there are any mentions to local users. if so we return true
  for (const operation of commit.ops) {
    // we check lik
    if(operation.action === 'create' && operation.path.startsWith('app.bsky.feed.like')){
      if(didsToCheck.some(elem => operation.record.subject.uri.includes(elem)) ) {
        return true;
      }
    }
    if(operation.action === 'create' && operation.path.startsWith('app.bsky.feed.post') && operation.record.facets){
      const mentions = operation.record.facets.flatMap(elem => elem.features).map(elem=> elem.did).filter(elem => elem)
      if(mentions && mentions.length && mentions.some(mention => didsToCheck.includes(mention))){
        res = true;
        return res;
      }
    }
  }
  // second one first approach: is post being replied on db? if so we store it.
  const urisToCheck: string[] = commit.ops.filter(op => op.action === 'create' && op.path.startsWith('app.bsky.feed.post') && op.record?.reply).map(op => op.record.reply.root.uri)
  let postsFounds = 0;


  if(urisToCheck.length > 0) {
    // if post starts with uri of any of our users it must be in reply to one of our users!
    if (urisToCheck.map(elem => elem.split('/app.bsky.feed.post/')[0]).some(elem => didsToCheck.includes(elem))){
      return true;
    }
    postsFounds = await Post.count({
      where: {
        bskyUri: {
          [Op.in]: urisToCheck
        }
      }
    })
  }
  if(postsFounds > 0) {
    res = true;
  }
  return res;
}


export {checkCommitMentions}

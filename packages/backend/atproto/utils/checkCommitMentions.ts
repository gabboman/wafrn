import {ParsedCommit} from "@skyware/firehose";

async function checkCommitMentions(commit: ParsedCommit, didsToCheck: string[]): Promise<boolean> {
  let res = false;
  // first we check if there are any mentions to local users. if so we return true
  for (const operation of commit.ops) {
    if(operation.action === 'create' && operation.path.startsWith('app.bsky.feed.post') && operation.record.facets){
      const mentions = operation.record.facets.flatMap(elem => elem.features).map(elem=> elem.did).filter(elem => elem)
      if(mentions && mentions.length && mentions.some(mention => didsToCheck.includes(mention))){
        res = true;
        return res;
      }
    }
  }
  // second one first approach: is post being replied on db? if so we store it.

  return res;
}


export {checkCommitMentions}

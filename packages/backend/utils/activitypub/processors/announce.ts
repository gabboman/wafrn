import { Post } from '../../../db.js'
import { environment } from '../../../environment.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { logger } from '../../logger.js'
import { getPostThreadRecursive } from '../getPostThreadRecursive.js'
import { getApObjectPrivacy } from '../getPrivacy.js'
import { signAndAccept } from '../signAndAccept.js'

async function AnnounceActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  // check if posthas been procesed already
  const existingPost = await Post.findOne({
    where: {
      remoteId: apObject.id
    }
  })
  if (existingPost) {
    return;
  }
  // LEMMY HACK
  let urlToGet =
    typeof apObject.object === 'string'
      ? apObject.object
      : apObject.object.object
        ? apObject.object.object
        : apObject.id
  urlToGet = typeof urlToGet === 'string' ? urlToGet : urlToGet?.id
  if (!urlToGet) {
    const error = new Error()
    logger.debug({
      message: `trying to get a non existing url`,
      trace: error.stack,
      object: apObject
    })
    return null
  }
  // GOD LORD, THIS IS HERE JUST BECAUSE LEMMY.
  const retooted_content = await getPostThreadRecursive(user, urlToGet)

  if (!retooted_content) {
    logger.trace(`We could not get remote post to be retooted: ${urlToGet}`)
    logger.trace(body)
  }

  const privacy = getApObjectPrivacy(apObject, remoteUser)
  if (remoteUser.url !== environment.deletedUser && retooted_content) {
    const postToCreate = {
      content: '',
      content_warning: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: remoteUser.id,
      remotePostId: body.id,
      privacy: privacy,
      parentId: retooted_content.id
    }
    const newToot = await Post.create(postToCreate)
    await newToot.save()
    // await signAndAccept({ body: body }, remoteUser, user)
  }
}

export { AnnounceActivity }

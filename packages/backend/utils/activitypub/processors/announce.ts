import { Post } from '../../../db'
import { environment } from '../../../environment'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject'
import { logger } from '../../logger'
import { getPostThreadRecursive } from '../getPostThreadRecursive'
import { getApObjectPrivacy } from '../getPrvacy'
import { signAndAccept } from '../signAndAccept'

async function AnnounceActivity(body: any, remoteUser: any, user: any) {
  const apObject: activityPubObject = body.object
  // LEMMY HACK
  let urlToGet = typeof body.object === 'string' ? body.object : body.object.object
  urlToGet = typeof urlToGet === 'string' ? urlToGet : urlToGet?.id
  if (!urlToGet) {
    logger.debug(`trying to get a non existing url`)
    logger.debug(apObject)
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
    await signAndAccept({ body: body }, remoteUser, user)
  }
}

export { AnnounceActivity }

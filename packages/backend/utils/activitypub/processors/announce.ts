import { Notification, Post, User } from '../../../models/index.js'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { logger } from '../../logger.js'
import { createNotification } from '../../pushNotifications.js'
import { getPostThreadRecursive } from '../getPostThreadRecursive.js'
import { getApObjectPrivacy } from '../getPrivacy.js'
import { signAndAccept } from '../signAndAccept.js'
import { completeEnvironment } from '../../backendOptions.js'

async function AnnounceActivity(body: activityPubObject, remoteUser: User, user: User) {
  const apObject: activityPubObject = body
  // check if posthas been procesed already
  const existingPost = await Post.findOne({
    where: {
      remotePostId: apObject.id
    }
  })
  if (existingPost) {
    return existingPost
  }
  let createdAt = new Date()
  if (apObject.published) createdAt = new Date(apObject.published)

  if (createdAt.getTime() > new Date().getTime()) {
    createdAt = new Date()
  }
  // LEMMY HACK
  if (typeof apObject.object === 'string') {
    let urlToGet = apObject.object
    urlToGet = urlToGet
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

    if (remoteUser.url !== completeEnvironment.deletedUser && retooted_content) {
      const postToCreate = {
        content: '',
        isReblog: true,
        content_warning: '',
        createdAt: createdAt,
        updatedAt: createdAt,
        userId: remoteUser.id,
        remotePostId: body.id,
        privacy: privacy,
        parentId: retooted_content.id
      }
      const newToot = await Post.create(postToCreate)
      await newToot.save()
      await createNotification(
        {
          notificationType: 'REWOOT',
          postId: retooted_content.id,
          notifiedUserId: retooted_content.userId,
          userId: remoteUser.id
        },
        {
          postContent: retooted_content.content,
          userUrl: remoteUser.url
        }
      )

      return newToot
      // await signAndAccept({ body: body }, remoteUser, user)
    }
  } else {
    // this is a lemmy object
    if (apObject.object.object || apObject.object.id) {
      // we try fetching the remote post thats the trick.
      const adminUser = (await User.findOne({
        where: {
          url: completeEnvironment.adminUser
        }
      })) as User
      let urlToGet = typeof apObject.object.object === 'string' ? apObject.object.object : apObject.object.id
      const alreadyExisting = await Post.findOne({ where: { remotePostId: urlToGet } })
      const reblogCount = alreadyExisting
        ? await Post.count({
            where: {
              parentId: alreadyExisting.id,
              isReblog: true,
              userId: remoteUser.id
            }
          })
        : 0
      if (!(alreadyExisting && reblogCount > 0)) {
        // well we got an existing post already. We check if there is at least one reblog of the post.
        // If not, we fix that. But ony if one
        let remotePost = await getPostThreadRecursive(adminUser, urlToGet)
        if (remotePost) {
          let post = await Post.create({
            content: '',
            isReblog: true,
            content_warning: '',
            createdAt: createdAt,
            updatedAt: createdAt,
            userId: remoteUser.id,
            remotePostId: body.id,
            privacy: 0,
            parentId: remotePost.id
          })
        }
      }
    }
  }
}

export { AnnounceActivity }

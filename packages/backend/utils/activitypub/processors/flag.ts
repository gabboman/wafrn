import { Model, Op } from 'sequelize'
import { activityPubObject } from '../../../interfaces/fediverse/activityPubObject.js'
import { isArray } from 'underscore'
import { environment } from '../../../environment.js'
import sequelize from 'sequelize/lib/sequelize'
import { Post, PostReport, User } from '../../../models/index.js'
import { logger } from '../../logger.js'
import sendActivationEmail from '../../sendActivationEmail.js'

async function flagActivity(body: activityPubObject, remoteUser: any, user: any) {
  const apObject: activityPubObject = body
  const listOfReportedObjects: string[] = isArray(apObject.object)
    ? apObject.object
    : [apObject.object].filter((elem) => !!elem)
  const reportedUsersUrl = listOfReportedObjects.filter((elem) =>
    elem.startsWith(`${environment.frontendUrl}/fediverse/blog/`)
  )
  const reportedPostsIds = listOfReportedObjects
    .filter(
      (elem) =>
        elem.startsWith(`${environment.frontendUrl}/fediverse/activity/post/`) ||
        elem.startsWith(`${environment.frontendUrl}/fediverse/post/`)
    )
    .map((elem) =>
      elem
        .replaceAll(`${environment.frontendUrl}/fediverse/activity/post/`, '')
        .replaceAll(`${environment.frontendUrl}/fediverse/post/`, '')
    )
  if (reportedPostsIds.length == 0 && reportedUsersUrl.length > 0) {
    const body = `Here you go: ${reportedPostsIds.join(', ')}`
    const subject = `There has been a report that is directed towards an user but does not includes post`
    await sendActivationEmail(environment.adminEmail, '', subject, body)
  } else {
    const reportedPosts = await Post.findAll({
      where: {
        id: {
          [Op.in]: reportedPostsIds
        }
      }
    })
    const foundPostsIds: string[] = reportedPosts.map((elem) => elem.id)
    await PostReport.bulkCreate(
      foundPostsIds.map((elem) => {
        return {
          resolved: false,
          severity: 0,
          description: apObject.content ?? '',
          userId: remoteUser.id,
          postId: elem
        }
      })
    )
  }
}

export { flagActivity }

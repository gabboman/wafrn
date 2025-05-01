import { Op } from "sequelize";
import { getNotificationBody, getNotificationTitle, NotificationBody, NotificationContext } from "./pushNotifications.js";
import { UnifiedPushData } from "../models/unifiedPushData.js";
import { getMutedPostsMultiple } from "./cacheGetters/getMutedPosts.js";
import { environment } from '../environment.js'
import WebPush from 'web-push'

const adminLink = `https://${environment.instanceUrl}/blog/${environment.adminUser}`
console.log(adminLink, environment.webPushPublicKey, environment.webPushPrivateKey)
WebPush.setVapidDetails(adminLink, environment.webPushPublicKey, environment.webPushPrivateKey)

export async function sendWebPushNotifications(
  notifications: NotificationBody[],
  context?: NotificationContext
) {
  const userIds = notifications.map((elem) => elem.notifiedUserId)
  const pushDataRows = await UnifiedPushData.findAll({
    where: {
      userId: {
        [Op.in]: userIds
      }
    }
  })
  const mutedPosts = await getMutedPostsMultiple(userIds, true)

  for (const notification of notifications) {
    const userId = notification.notifiedUserId
    const mutes = mutedPosts.get(userId)
    const isMuted = (mutes && notification.postId) ? mutes.includes(notification.postId) : false
    if (!isMuted) {
      const userDevices = pushDataRows.filter((p) => p.userId === userId)
      for (const device of userDevices) {
        await sendWebPushNotification(notification, device, context)
      }
    }
  }
}

async function sendWebPushNotification(
  notification: NotificationBody,
  device: UnifiedPushData,
  context?: NotificationContext
) {
  try {
    await WebPush.sendNotification(
      {
        endpoint: device.endpoint,
        keys: {
          auth: device.deviceAuth,
          p256dh: device.devicePublicKey
        }
      },
      JSON.stringify(getNotificationPayload(notification, context))
    )
  } catch (error) {
    console.error('Error sending web push notification: ', error)
  }
}

function getNotificationId(notification: NotificationBody) {
  const key = `${notification.notifiedUserId}-${notification.userId}-${notification.notificationType}-${notification.postId}`
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)).then((hash) => {
    return Buffer.from(hash).toString('binary')
  })
}

function getNotificationUrl(notification: NotificationBody) {
  if (notification.notificationType === 'FOLLOW') {
    return `wafrn://user/${notification.notifiedUserId}`
  } else {
    return `wafrn://post/${notification.postId}`
  }
}

async function getNotificationPayload(notification: NotificationBody, context?: NotificationContext) {
  return {
    id: await getNotificationId(notification),
    url: getNotificationUrl(notification),
    title: getNotificationTitle(notification, context),
    body: getNotificationBody(notification, context),
  }
}
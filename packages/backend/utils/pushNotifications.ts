import { Expo, type ExpoPushErrorTicket } from 'expo-server-sdk'
import { logger } from './logger.js'
import { Notification, PushNotificationToken } from '../db.js'
import { Queue } from 'bullmq'
import { environment } from '../environment.js'
import { getAllLocalUserIds } from './cacheGetters/getAllLocalUserIds.js'
import dompurify from 'isomorphic-dompurify'

type PushNotificationPayload = {
  notifications: NotificationBody[]
  context?: NotificationContext
}

const sendPushNotificationQueue = new Queue<PushNotificationPayload>('sendPushNotification', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
})

export type NotificationBody = {
  notifiedUserId: string
  userId: string
  notificationType: 'FOLLOW' | 'LIKE' | 'REWOOT' | 'MENTION' | 'QUOTE' | 'EMOJIREACT'
  postId?: string
  emojiReactionId?: string
  createdAt?: Date
  updatedAt?: Date
}

export type NotificationContext = {
  postContent?: string
  userUrl?: string
  emoji?: string
  ignoreDuplicates?: boolean
}

export async function deleteToken(token: string) {
  return PushNotificationToken.destroy({
    where: {
      token
    }
  })
}

const expoClient = new Expo()

export async function bulkCreateNotifications(notifications: NotificationBody[], context?: NotificationContext) {
  const localUserIds = await getAllLocalUserIds()
  const localUserNotifications = notifications.filter((elem) => localUserIds.includes(elem.notifiedUserId))
  if (localUserNotifications.length > 0) {
    if (context && context.postContent) {
      context.postContent = dompurify.sanitize(context.postContent, { ALLOWED_TAGS: [] })
    }
    const notificationDate = notifications[0].createdAt ? notifications[0].createdAt : new Date()
    const timeDiff = Math.abs(new Date().getTime() - notificationDate.getTime())
    const sendNotifications =
      timeDiff < 3600 * 1000 ? sendPushNotificationQueue.add('sendPushNotification', { notifications, context }) : null
    await Promise.all([
      Notification.bulkCreate(localUserNotifications, { ignoreDuplicates: context?.ignoreDuplicates }),
      sendNotifications
    ])
  }
}

export async function createNotification(notification: NotificationBody, context?: NotificationContext) {
  const localUserIds = await getAllLocalUserIds()
  if (localUserIds.includes(notification.notifiedUserId)) {
    if (context && context.postContent) {
      context.postContent = dompurify.sanitize(context.postContent, { ALLOWED_TAGS: [] })
    }
    const notificationDate = notification.createdAt ? notification.createdAt : new Date()
    const timeDiff = Math.abs(new Date().getTime() - notificationDate.getTime())
    const sendNotification =
      timeDiff < 3600 * 1000
        ? sendPushNotificationQueue.add('sendPushNotification', {
            notifications: [notification],
            context
          })
        : null
    await Promise.all([Notification.create(notification), sendNotification])
  }
}

// Error codes reference: https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
export async function handleDeliveryError(response: ExpoPushErrorTicket) {
  logger.error(response)
  const error = response.details?.error

  // do not send notifications again to this token until it is registered again
  if (error === 'DeviceNotRegistered') {
    const token = response.details?.expoPushToken
    if (token) {
      await deleteToken(token)
    }
  }
}

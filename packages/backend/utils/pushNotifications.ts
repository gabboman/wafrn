import { Expo, type ExpoPushErrorTicket } from "expo-server-sdk"
import { logger } from "./logger.js"
import { Notification, PushNotificationToken } from "../db.js"
import { Queue } from "bullmq"
import { environment } from "../environment.js"

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
  await Promise.all([
    Notification.bulkCreate(notifications, { ignoreDuplicates: context?.ignoreDuplicates }),
    sendPushNotificationQueue.add('sendPushNotification', { notifications, context })
  ])
}

export async function createNotification(notification: NotificationBody, context?: NotificationContext) {
  await Promise.all([
    Notification.create(notification),
    sendPushNotificationQueue.add('sendPushNotification', { notifications: [notification], context })
  ])
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

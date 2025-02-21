import { ExpoPushErrorTicket } from "expo-server-sdk"
import { Expo } from "expo-server-sdk"
import { logger } from "./logger.js"
import { Notification, PushNotificationToken } from "../db.js"

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
}

export async function deleteToken(token: string) {
  return PushNotificationToken.destroy({
    where: {
      token
    }
  })
}

const expoClient = new Expo()

export async function createNotification(notification: NotificationBody, context?: NotificationContext) {
  await Promise.all([
    Notification.create(notification),
    sendNotification(notification, context)
  ])
}
            
// Error codes reference: https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
async function handleDeliveryError(response: ExpoPushErrorTicket) {
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

const verbMap = {
  LIKE: 'liked',
  REWOOT: 'rewooted',
  MENTION: 'replied to',
  QUOTE: 'quoted',
  EMOJIREACT: 'reacted to',
}

function getNotificationTitle(notification: NotificationBody, context?: NotificationContext) {
  if (notification.notificationType === 'FOLLOW') {
    return 'New user followed you'
  }

  if (notification.notificationType === 'EMOJIREACT' && context?.emoji) {
    return `${context?.userUrl || 'someone'} reacted with ${context.emoji} to your post`
  }

  return `${context?.userUrl || 'someone'} ${verbMap[notification.notificationType]} your post`
}

function getNotificationBody(notification: NotificationBody, context?: NotificationContext) {
  if (notification.notificationType === 'FOLLOW') {
    return context?.userUrl ? `@${context?.userUrl.replace(/^@/, '')}` : ''
  }

  return `${context?.postContent}`
}

async function sendNotification(notification: NotificationBody, context?: NotificationContext) {
  const userId = notification.notifiedUserId
  const tokenRows = await PushNotificationToken.findAll({
    where: {
      userId
    }
  })

  if (tokenRows.length === 0) {
    return
  }

  const payloads = tokenRows.map((row) => ({
    to: row.token,
    sound: 'default',
    title: getNotificationTitle(notification, context),
    body: getNotificationBody(notification, context),
    data: notification
  }))

  // this will chunk the payloads into chunks of 1000 (max) and compress notifications with similar content
  const chunks = expoClient.chunkPushNotifications(payloads)
  const okTickets = []

  // TODO: handle in a queue with retry logic and exponential backoff
  for (const chunk of chunks) {
    try {
      const responses = await expoClient.sendPushNotificationsAsync(chunk)
      for (const response of responses) {
        if (response.status === 'ok') {
          okTickets.push(response.id)
        } else {
          await handleDeliveryError(response)
        }
      }
    } catch (error) {
      logger.error(error)
      // TODO: retry sending the notification after some time
    }
  }

  scheduleNotificationCheck(okTickets)
}

function scheduleNotificationCheck(ticketIds: string[]) {
  // TODO: enqueue a task in the queue to check that the okTickets are actually ok and were delivered to the device
}

export async function checkNotificationDelivery(ticketIds: string[]) {
  let receiptIdChunks = expoClient.chunkPushNotificationReceiptIds(ticketIds);
  for (const chunk of receiptIdChunks) {
    try {
      const receipts = await expoClient.getPushNotificationReceiptsAsync(chunk)

      // The receipts specify whether Apple or Google successfully received the
      // notification and information about an error, if one occurred.
      for (const receiptId in receipts) {
        const receipt = receipts[receiptId]
        if (receipt.status === 'error') {
          await handleDeliveryError(receipt)
        }
      }
    } catch (error) {
      // TODO: retry checking the delivery of the notification after some time
      logger.error(error)
    }
  }
}
import { Expo } from "expo-server-sdk"
import { PushNotificationToken } from "../../db.js"
import { logger } from "../logger.js"
import { handleDeliveryError, type NotificationBody, type NotificationContext } from "../pushNotifications.js"
import { Job, Queue } from "bullmq"
import { environment } from "../../environment.js"

const deliveryCheckQueue = new Queue('checkPushNotificationDelivery', {
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

const verbMap = {
  LIKE: 'liked',
  REWOOT: 'rewooted',
  MENTION: 'replied to',
  QUOTE: 'quoted',
  EMOJIREACT: 'reacted to',
}

const expoClient = new Expo()

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

type PushNotificationPayload = {
  notification: NotificationBody
  context?: NotificationContext
}

export async function sendPushNotification(job: Job<PushNotificationPayload>) {
  const { notification, context } = job.data
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

  await scheduleNotificationCheck(okTickets)
}

function scheduleNotificationCheck(ticketIds: string[]) {
  const delay = 1000 * 60 * 30 // 30 minutes
  return deliveryCheckQueue.add('checkPushNotificationDelivery', { ticketIds}, { delay })
}

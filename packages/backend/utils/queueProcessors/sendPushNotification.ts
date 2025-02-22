import { Expo } from 'expo-server-sdk'
import { PushNotificationToken } from '../../db.js'
import { logger } from '../logger.js'
import { handleDeliveryError, type NotificationBody, type NotificationContext } from '../pushNotifications.js'
import { Job, Queue } from 'bullmq'
import { environment } from '../../environment.js'
import { Op } from 'sequelize'
import { getMutedPosts } from '../cacheGetters/getMutedPosts.js'

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
  EMOJIREACT: 'reacted to'
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
  notifications: NotificationBody[]
  context?: NotificationContext
}

export async function sendPushNotification(job: Job<PushNotificationPayload>) {
  const { notifications, context } = job.data
  const userIds = notifications.map((elem) => elem.notifiedUserId)
  const tokenRows = await PushNotificationToken.findAll({
    where: {
      userId: {
        [Op.in]: userIds
      }
    }
  })

  if (tokenRows.length === 0) {
    return
  }
  const payloads = notifications.map((notification) => {
    const tokens = tokenRows
      .filter((row) => row.userId === notification.notifiedUserId)
      .filter(async (row) => {
        const mutedPosts = (await getMutedPosts(notification.notifiedUserId, false)).concat(
          await getMutedPosts(notification.notifiedUserId, true)
        )
        return !mutedPosts.includes(notification.postId ? notification.postId : '')
      })
      .map((row) => row.token)

    // send the same notification to all the devices of each notified user
    return {
      to: tokens,
      sound: 'default',
      title: getNotificationTitle(notification, context),
      body: getNotificationBody(notification, context),
      data: { notification, context }
    }
  })

  // this will chunk the payloads into chunks of 1000 (max) and compress notifications with similar content
  const chunks = expoClient.chunkPushNotifications(payloads)
  const okTickets = []

  for (const chunk of chunks) {
    const responses = await expoClient.sendPushNotificationsAsync(chunk)
    for (const response of responses) {
      if (response.status === 'ok') {
        okTickets.push(response.id)
      } else {
        await handleDeliveryError(response)
      }
    }
  }

  await scheduleNotificationCheck(okTickets)
}

// schedule a job to check the delivery of the notifications after 30 minutes of being sent
// this guarantees that the notification was delivered to the messaging services even in cases of high load
function scheduleNotificationCheck(ticketIds: string[]) {
  const delay = 1000 * 60 * 30 // 30 minutes
  return deliveryCheckQueue.add('checkPushNotificationDelivery', { ticketIds }, { delay })
}

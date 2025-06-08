import { Expo } from 'expo-server-sdk'
import { Follows, Notification, PushNotificationToken, UserOptions } from '../../models/index.js'
import { logger } from '../logger.js'
import {
  getNotificationBody,
  getNotificationTitle,
  handleDeliveryError,
  type NotificationBody,
  type NotificationContext
} from '../pushNotifications.js'
import { Job, Queue } from 'bullmq'
import { environment } from '../../environment.js'
import { Op } from 'sequelize'
import { getMutedPosts } from '../cacheGetters/getMutedPosts.js'
import { sendWebPushNotifications } from '../webpush.js'

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

const websocketQueue = new Queue('updateNotificationsSocket', {
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

const expoClient = new Expo()

type PushNotificationPayload = {
  notifications: NotificationBody[]
  context?: NotificationContext
}

export async function sendPushNotification(job: Job<PushNotificationPayload>) {
  const { notifications, context } = job.data
  let notificationsToSend: NotificationBody[] = []
  for await (const notification of notifications) {
    const mutedPosts = new Set(
      (await getMutedPosts(notification.notifiedUserId, false)).concat(
        await getMutedPosts(notification.notifiedUserId, true)
      )
    )
    if (!mutedPosts.has(notification.postId ? notification.postId : '')) {
      // TODO this part of code is repeated. take it to a function another day
      const options = await UserOptions.findAll({
        where: {
          userId: notification.notifiedUserId,
          optionName: {
            [Op.in]: [
              'wafrn.notificationsFrom',
              'wafrn.notifyMentions',
              'wafrn.notifyReactions',
              'wafrn.notifyQuotes',
              'wafrn.notifyFollows',
              'wafrn.notifyRewoots'
            ]
          }
        }
      })
      const optionNotificationsFrom = options.find((elem) => elem.optionName == 'wafrn.notificationsFrom')
      const optionNotifyQuotes = options.find((elem) => elem.optionName == 'wafrn.notifyQuotes')
      const optionNotifyMentions = options.find((elem) => elem.optionName == 'wafrn.notifyMentions')
      const optionNotifyReactions = options.find((elem) => elem.optionName == 'wafrn.notifyReactions')
      const optionNotifyFollows = options.find((elem) => elem.optionName == 'wafrn.notifyFollows')
      const optionNotifyRewoots = options.find((elem) => elem.optionName == 'wafrn.notifyRewoots')

      const notificationTypes = []
      if (!optionNotifyQuotes || optionNotifyQuotes.optionValue != 'false') {
        notificationTypes.push('QUOTE')
      }
      if (!optionNotifyMentions || optionNotifyMentions.optionValue != 'false') {
        notificationTypes.push('MENTION')
      }
      if (!optionNotifyReactions || optionNotifyReactions.optionValue != 'false') {
        notificationTypes.push('EMOJIREACT')
        notificationTypes.push('LIKE')
      }
      if (!optionNotifyFollows || optionNotifyFollows.optionValue != 'false') {
        notificationTypes.push('FOLLOW')
      }
      if (!optionNotifyRewoots || optionNotifyRewoots.optionValue != 'false') {
        notificationTypes.push('REWOOT')
      }
      if (notificationTypes.includes(notification.notificationType)) {
        if (optionNotificationsFrom && optionNotificationsFrom.optionValue != '1') {
          let validUsers: string[] = []
          switch (optionNotificationsFrom.optionValue) {
            case '2': // followers
              validUsers = (
                await Follows.findAll({
                  where: {
                    accepted: true,
                    followedId: notification.notifiedUserId
                  }
                })
              ).map((elem) => elem.followerId)
            case '3': // followees
              validUsers = (
                await Follows.findAll({
                  where: {
                    accepted: true,
                    followerId: notification.notifiedUserId
                  }
                })
              ).map((elem) => elem.followedId)
            case '4': // mutuals
              const followerIds = (
                await Follows.findAll({
                  where: {
                    accepted: true,
                    followedId: notification.notifiedUserId
                  }
                })
              ).map((elem) => elem.followerId)
              validUsers = (
                await Follows.findAll({
                  where: {
                    accepted: true,
                    followerId: notification.notifiedUserId,
                    followedId: {
                      [Op.in]: followerIds
                    }
                  }
                })
              ).map((elem) => elem.followedId)
              if (validUsers.includes(notification.userId)) {
                notificationsToSend.push(notification)
              }
              continue
          }
        } else {
          notificationsToSend.push(notification)
          continue
        }
      }
    }
  }
  await sendWebPushNotifications(notificationsToSend, context)
  await sendExpoNotifications(notificationsToSend, context)
  await sendWsNotifications(notificationsToSend, context)
}

export async function sendExpoNotifications(notifications: NotificationBody[], context?: NotificationContext) {
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
    const tokens = tokenRows.filter((row) => row.userId === notification.notifiedUserId).map((row) => row.token)

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
  const okTickets = []
  const filteredPayloads: {
    to: any[]
    sound: string
    title: string
    body: string
    data: {
      notification: NotificationBody
      context: NotificationContext | undefined
    }
  }[] = []
  for await (const payload of payloads) {
    const mutedPosts = (await getMutedPosts(payload.data.notification.notifiedUserId, false)).concat(
      await getMutedPosts(payload.data.notification.notifiedUserId, true)
    )
    if (!mutedPosts.includes(payload.data.notification.postId as string)) {
      filteredPayloads.push(payload)
    }
  }
  const chunks = expoClient.chunkPushNotifications(filteredPayloads)
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

async function sendWsNotifications(notifications: NotificationBody[], context?: NotificationContext){
  await websocketQueue.addBulk( notifications.map(elem => {
    // we just tell the user to update the notifications
    return {
      name: 'updateNotificationsSocket',
      data: {userId: elem.notifiedUserId}
    }
  }) )
}

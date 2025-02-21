import { Job } from "bullmq";
import { logger } from "../logger.js";
import { handleDeliveryError } from "../pushNotifications.js";
import { Expo } from "expo-server-sdk";

const expoClient = new Expo()

export async function checkPushNotificationDelivery(job: Job<{ ticketIds: string[] }>) {
  const { ticketIds } = job.data
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

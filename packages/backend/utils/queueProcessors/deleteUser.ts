import { Job, Worker } from 'bullmq'
import { logger } from '../logger'
import { removeUser } from '../activitypub/removeUser'
async function deleteUserWorker(job: Job) {
  try {
    await removeUser(job.data.remoteId)
  } catch (error) {
    logger.info(`Failed to delete user ${job.data.remoteId}`)
  }
}

export { deleteUserWorker }

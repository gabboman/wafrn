import { Job } from 'bullmq'
import { logger } from '../logger'
import { postPetitionSigned } from '../activitypub/postPetitionSigned'

async function sendPostToInboxes(job: Job) {
  const inboxes: string[] = job.data.inboxList
  const localUser = job.data.petitionBy
  const objectToSend = job.data.objectToSend
  const promisesArray = inboxes.map((remoteInbox) => postPetitionSigned(objectToSend, localUser, remoteInbox))

  try {
    const tmp = await Promise.allSettled(promisesArray)
  } catch (error) {
    logger.debug(error)
  }
  return true
}

export { sendPostToInboxes }

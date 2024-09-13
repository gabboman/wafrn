import { Job } from 'bullmq'
import { logger } from '../logger'
import { postPetitionSigned } from '../activitypub/postPetitionSigned'

async function sendPostToInboxes(job: Job) {
  const inboxes: string[] = job.data.inboxList
  const localUser = job.data.petitionBy
  const objectToSend = job.data.objectToSend
  const promisesArray = inboxes.map((remoteInbox) => postPetitionSigned(objectToSend, localUser, remoteInbox))

  try {
    //at some point we should remove the array thing but at the same time yeah
    const tmp = await Promise.all(promisesArray)
  } catch (error) {
    logger.debug(error)
  }
  return true
}

export { sendPostToInboxes }

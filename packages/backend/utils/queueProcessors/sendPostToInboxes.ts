import { Job } from 'bullmq'
import { logger } from '../logger.js'
import { postPetitionSigned } from '../activitypub/postPetitionSigned.js'

async function sendPostToInboxes(job: Job) {
  const inbox: string = job.data.inboxList
  const localUser = job.data.petitionBy
  const objectToSend = job.data.objectToSend
  //at some point we should remove the array thing but at the same time yeah
  const tmp = await postPetitionSigned(objectToSend, localUser, inbox)
  return true
}

export { sendPostToInboxes }

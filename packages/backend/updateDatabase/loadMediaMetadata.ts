import { Queue } from 'bullmq'
import { Media } from '../models/index.js'
import { completeEnvironment } from './backendOptions.js'
import { Op } from 'sequelize'

const updateMediaDataQueue = new Queue('processRemoteMediaData', {
  connection: completeEnvironment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: true
  }
})

async function loadMediaData() {
  const mediasToUpdate = await Media.findAll({
    where: {
      mediaType: {
        [Op.eq]: null
      }
    },
    limit: 10000
  })

  await updateMediaDataQueue.addBulk(
    mediasToUpdate.map((media: any) => {
      return {
        name: `getMediaData${media.id}`,
        data: { mediaId: media.id }
      }
    })
  )
}

loadMediaData().then(() => {
  console.log('done')
})

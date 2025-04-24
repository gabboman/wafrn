import { Job } from 'bullmq'
import { User } from '../../models/index.js'
import { generateKeyPairSync } from 'crypto'
import { logger } from '../logger.js'

// this funcion is cpu expensive, so we generate it asyncronously.
// I mean this will take a few seconds at best,
// user wont be ready to be activated and post at that time
async function generateUserKeyPair(job: Job) {
  const user = await User.findByPk(job.data.userId)
  if (user) {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    })
    user.publicKey = publicKey
    user.privateKey = privateKey

    await user.save()
  } else {
    logger.error({
      message: `OH NO user not found for generating keys`,
      user: job.data.userId
    })
    throw new Error('User not found to generate keys!')
  }
}

export { generateUserKeyPair }

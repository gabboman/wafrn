import { Job } from 'bullmq'
import { User } from '../../db.js'
import { generateKeyPairSync } from 'crypto'

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
  }
}

export { generateUserKeyPair }

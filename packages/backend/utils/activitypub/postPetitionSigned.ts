import { createHash, createSign } from 'node:crypto'
import { environment } from '../../environment'
import { logger } from '../logger'
import { removeUser } from './removeUser'
import { User } from '../../db'
import axios from 'axios'

async function postPetitionSigned(message: object, user: any, target: string): Promise<any> {
  let res
  if (user.url === environment.deletedUser) {
    return {}
  }
  if (user.url === environment.deletedUser) {
    console.debug({
      warning: `POST petition to ${target} made by deleted user`,
      object: message
    })
  }
  try {
    const url = new URL(target)
    const digest = createHash('sha256').update(JSON.stringify(message)).digest('base64')
    const signer = createSign('sha256')
    const sendDate = new Date()
    const stringToSign = `(request-target): post ${url.pathname}\nhost: ${
      url.host
    }\ndate: ${sendDate.toUTCString()}\nalgorithm: rsa-sha256\ndigest: SHA-256=${digest}`
    signer.update(stringToSign)
    signer.end()
    const signature = signer.sign(user.privateKey).toString('base64')
    const header = `keyId="${
      environment.frontendUrl
    }/fediverse/blog/${user.url.toLocaleLowerCase()}#main-key",algorithm="rsa-sha256",headers="(request-target) host date algorithm digest",signature="${signature}"`
    const headers = {
      'Content-Type': 'application/activity+json',
      'User-Agent': environment.instanceUrl,
      Accept: 'application/activity+json',
      Algorithm: 'rsa-sha256',
      Host: url.host,
      Date: sendDate.toUTCString(),
      Digest: `SHA-256=${digest}`,
      Signature: header
    }

    res = await axios.post(target, message, { headers: headers })
  } catch (error: any) {
    if (error?.response?.status === 410) {
      logger.trace(`should remove user ${target}`)
      const userToRemove = await User.findOne({
        where: {
          remoteInbox: target
        }
      })
      if (userToRemove) {
        logger.trace(`removing user ${userToRemove.url} because got a 410`)
        removeUser(userToRemove.id)
      }
    } else {
      logger.trace({ message: 'error with signed post petition', error: error, inputMessage: message, target: target })
    }
  }
  return res
}

export { postPetitionSigned }

import { createHash, createSign } from 'node:crypto'
import { environment } from '../../environment'
import axios from 'axios'
import { logger } from '../logger'
import { User } from '../../db'
import { removeUser } from './removeUser'

async function getPetitionSigned(user: any, target: string): Promise<any> {
  let res = undefined

  try {
    const url = new URL(target)
    const privKey = user.privateKey
    const acceptedFormats = 'application/activity+json,application/json'
    const signingOptions = {
      key: privKey,
      keyId: `${environment.frontendUrl}/fediverse/blog/${user.url.toLocaleLowerCase()}#main-key`,
      algorithm: 'rsa-sha256',
      authorizationHeaderName: 'signature',
      headers: ['(request-target)', 'host', 'date', 'accept']
    }
    const sendDate = new Date()
    const stringToSign = `(request-target): get ${url.pathname}\nhost: ${
      url.host
    }\ndate: ${sendDate.toUTCString()}\naccept: ${acceptedFormats}`

    const digest = createHash('sha256').update(stringToSign).digest('base64')
    const signer = createSign('sha256')
    signer.update(stringToSign)
    signer.end()
    const signature = signer.sign(user.privateKey).toString('base64')
    const header = `keyId="${
      environment.frontendUrl
    }/fediverse/blog/${user.url.toLocaleLowerCase()}#main-key",algorithm="rsa-sha256",headers="(request-target) host date accept",signature="${signature}"`
    const headers = {
      'Content-Type': 'application/activity+json',
      'User-Agent': environment.instanceUrl,
      Accept: acceptedFormats,
      Algorithm: 'rsa-sha256',
      Host: url.host,
      Date: sendDate.toUTCString(),
      Digest: `SHA-256=${digest}`,
      Signature: header
    }
    const axiosResponse = await axios.get(target, { headers: headers })
    /*
    const contentType = axiosResponse.headers['Content-Type']?.toString().toLowerCase()
    if (
      !contentType ||
      !(
        contentType.includes('application/jrd+json') ||
        contentType.includes('application/activity+json') ||
        contentType.includes('application/ld+json')
      )
    ) {
      logger.debug(`url ${target}, Invalid content type: ${contentType}`)
      throw new Error(`Invalid content type: ${contentType}`)
    }
    */
    if (axiosResponse?.headers['content-type']?.includes('text/html')) {
      logger.trace('Petition returned HTML. throwing exception')
      throw new Error('Invalid content type')
    }
    res = axiosResponse.data
  } catch (error: any) {
    if (error.response?.status === 410) {
      const userToRemove = await User.findOne({
        where: {
          remoteInbox: target
        }
      })
      if (userToRemove) {
        removeUser(userToRemove.id)
      }
    } else {
      logger.trace({
        message: 'Error with signed get petition',
        url: target,
        error: error
      })
    }
  }
  return res
}

export { getPetitionSigned }

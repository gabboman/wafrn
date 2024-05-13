import * as crypto from 'node:crypto'
const jsonld = require('jsonld')
import axios from 'axios'
import { environment } from '../../environment'
import { logger } from '../logger'

//import { httpAgent, httpsAgent } from "@/misc/fetch.js";

// RsaSignature2017 based from https://github.com/transmute-industries/RsaSignature2017

const contextCache: Map<string, any> = new Map()

export class LdSignature {
  constructor() {}

  public async signRsaSignature2017(
    data: any,
    privateKey: string,
    creator: string,
    domain?: string,
    created?: Date
  ): Promise<any> {
    const options = {
      type: 'RsaSignature2017',
      creator,
      domain,
      nonce: crypto.randomBytes(16).toString('hex'),
      created: (created || new Date()).toISOString()
    } as {
      type: string
      creator: string
      domain?: string
      nonce: string
      created: string
    }

    if (!domain) {
      options.domain = undefined
    }

    const toBeSigned = await this.createVerifyData(data, options)
    const signer = crypto.createSign('sha256')
    signer.update(toBeSigned)
    signer.end()

    const signature = signer.sign(privateKey)

    return {
      ...data,
      signature: {
        ...options,
        signatureValue: signature.toString('base64')
      }
    }
  }

  public async verifyRsaSignature2017(data: any, publicKey: string): Promise<boolean> {
    const toBeSigned = await this.createVerifyData(data, data.signature)
    const verifier = crypto.createVerify('sha256')
    verifier.update(toBeSigned)
    return verifier.verify(publicKey, data.signature.params.signature, 'base64')
  }

  public async createVerifyData(data: any, options: any) {
    let res = ''
    try {
      const transformedOptions = {
        ...options,
        '@context': `${environment.frontendUrl}/contexts/identity-v1.jsonld`
      }

      //const canonizedOptions = await this.normalize(transformedOptions);
      const canonizedOptions = JSON.stringify(transformedOptions)
      const optionsHash = this.sha256(canonizedOptions)
      const transformedData = { ...data }
      transformedData['signature'] = undefined
      const canonizedData = await this.normalize(transformedData)
      const documentHash = this.sha256(canonizedData)
      const verifyData = `${optionsHash}${documentHash}`
      res = verifyData
    } catch (error) {
      logger.info(error)
    }

    return res
  }

  public async normalize(data: any) {
    return await jsonld.normalize(data, { documentLoader: this.getLoader(), safe: false })
  }

  private getLoader() {
    return async (url: string): Promise<any> => {
      if (contextCache.has(url)) {
        return {
          contextUrl: null,
          document: contextCache.get(url),
          documentUrl: url
        }
      } else {
        const document = await jsonld.documentLoader(url)
        contextCache.set(url, document)
        return {
          contextUrl: null,
          document: document,
          documentUrl: url
        }
      }
    }
  }

  public sha256(data: string): string {
    const hash = crypto.createHash('sha256')
    hash.update(data)
    return hash.digest('hex')
  }
}

import * as crypto from 'node:crypto'
import jsonld, { Options } from 'jsonld'
import axios from 'axios'
import { completeEnvironment } from '../backendOptions.js'
import { logger } from '../logger.js'
import { getPreloadedContexts, PRELOADED_CONTEXTS } from './contexts.js'
import { JsonLd, RemoteDocument } from 'jsonld/jsonld-spec.js'

//import { httpAgent, httpsAgent } from "@/misc/fetch.js";

// RsaSignature2017 based from https://github.com/transmute-industries/RsaSignature2017

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
    const result = verifier.verify(publicKey, data.signature.signatureValue, 'base64')
    return result
  }

  public async createVerifyData(data: any, options: any): Promise<string> {
    const transformedOptions = {
      ...options,
      '@context': `${completeEnvironment.frontendUrl}/contexts/identity-v1.jsonld`
    }
    delete transformedOptions['type']
    delete transformedOptions['id']
    delete transformedOptions['signatureValue']
    const canonizedOptions = await this.normalize(transformedOptions)
    const optionsHash = this.sha256(canonizedOptions.toString())
    const transformedData = { ...data }
    delete transformedData['signature']
    const cannonidedData = await this.normalize(transformedData)
    //const compact = await this.compact(cannonidedData)
    // logger.debug(`cannonidedData: ${cannonidedData}`)
    const documentHash = this.sha256(cannonidedData.toString())
    const verifyData = `${optionsHash}${documentHash}`
    return verifyData
  }

  public async normalize(data: any) {
    // TODO improve this so we get some cache or something
    const res = await jsonld.normalize(data, { documentLoader: this.getLoader(), safe: false } as Options.Normalize)
    return res
  }

  public sha256(data: string): string {
    const hash = crypto.createHash('sha256')
    hash.update(data)
    return hash.digest('hex')
  }

  private getLoader() {
    return async (url: string): Promise<RemoteDocument> => {
      const contexts = getPreloadedContexts()
      if (url in contexts) {
        return {
          contextUrl: undefined,
          document: contexts[url],
          documentUrl: url
        }
      }

      const document = await this.fetchDocument(url)
      return {
        contextUrl: undefined,
        document: document,
        documentUrl: url
      }
    }
  }

  private async fetchDocument(url: string): Promise<JsonLd> {
    const headers = {
      'User-Agent': completeEnvironment.instanceUrl,
      Accept: 'application/ld+json, application/json'
    }
    const axiosResponse = await axios.get(url, { headers: headers })
    return axiosResponse.data
  }
}

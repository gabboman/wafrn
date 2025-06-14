import { Application, Request, Response } from 'express'
import crypto from 'crypto'
import fs from 'fs'
import axios, { AxiosResponse } from 'axios'
import { logger } from '../utils/logger.js'
import optimizeMedia from '../utils/optimizeMedia.js'
import { environment } from '../environment.js'
import { Resolver } from 'did-resolver'
import { getResolver } from 'plc-did-resolver'
import { redisCache } from '../utils/redis.js'
import { getLinkPreview } from 'link-preview-js'
import { linkPreviewRateLimiter } from '../utils/rateLimiters.js'

function extensionFromMimeType(mime: string) {
  return mime.split('/').pop()?.replace('jpeg', 'jpg').replace('svg+xml', 'svg').replace('x-icon', 'ico') || ''
}

function sendWithCache(res: Response, localFileName: string) {
  // 1 hour of cache
  res.set('Cache-control', 'public, max-age=3600')
  res.set('Content-Disposition', `inline; filename="${localFileName.split('/').pop()}"`)
  res.sendFile(localFileName, { root: '.' })
}

// converting the stream parsing to a promise to be able to use async/await and catch the errors with the try/catch blocks
function writeStream(stream: AxiosResponse, localFileName: string) {
  const writeStream = fs.createWriteStream(localFileName)
  return new Promise((resolve, reject) => {
    writeStream.on('finish', async () => {
      writeStream.close()
      return resolve(localFileName)
    })
    writeStream.on('error', (error) => {
      return reject(error)
    })
    stream.data.pipe(writeStream)
  })
}

export default function cacheRoutes(app: Application) {
  app.get('/api/cache', async (req: Request, res: Response) => {
    let mediaUrl = String(req.query?.media)
    const mediaLinkHash = crypto.createHash('sha256').update(mediaUrl).digest('hex')
    let localFileName = `cache/${mediaLinkHash}`
    const avatarTransform = String(req.query?.avatar) === 'true'

    if (!mediaUrl) {
      res.sendStatus(404)
      return
    }
    // if file exists
    if (fs.existsSync(localFileName)) {
      return await sendWithCache(res, localFileName)
    } else {
      try {
        if (mediaUrl.startsWith('?cid=')) {
          try {
            const did = decodeURIComponent(mediaUrl.split('&did=')[1])
            const cid = decodeURIComponent(mediaUrl.split('&did=')[0].split('?cid=')[1])
            if (!did || !cid) {
              return res.sendStatus(400)
            }
            const plcResolver = getResolver()
            const didResolver = new Resolver(plcResolver)
            const didData = await didResolver.resolve(did)
            if (didData?.didDocument?.service) {
              const url =
                didData.didDocument.service[0].serviceEndpoint +
                '/xrpc/com.atproto.sync.getBlob?did=' +
                encodeURIComponent(did) +
                '&cid=' +
                encodeURIComponent(cid)
              mediaUrl = url
            }
          } catch (error) {
            return res.sendStatus(500)
          }
        }
        const response = await axios.get(mediaUrl, {
          responseType: 'stream',
          headers: { 'User-Agent': 'wafrnCacher' }
        })

        response.data.pipe(res)
        await writeStream(response, localFileName)
      } catch (error) {
        return res.sendStatus(500)
      }
    }
  })

  app.get('/api/linkPreview', linkPreviewRateLimiter, async (req: Request, res: Response) => {
    const url = String(req.query?.url)
    const shasum = crypto.createHash('sha1')
    shasum.update(url.toLowerCase())
    const urlHash = shasum.digest('hex')
    const cacheResult = await redisCache.get('linkPreviewCache:' + urlHash)
    if (cacheResult) {
      res.send(cacheResult)
    } else {
      let result = {}
      try {
        result = await getLinkPreview(url, {
          followRedirects: 'follow',
          headers: { 'User-Agent': environment.instanceUrl }
        })
      } catch (error) {}
      // we cache the url 24 hours if success, 5 minutes if not
      await redisCache.set('linkPreviewCache:' + urlHash, JSON.stringify(result), 'EX', result ? 3600 * 24 : 300)
      res.send(result)
    }
  })
}

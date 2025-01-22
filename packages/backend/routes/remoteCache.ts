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
    const mediaUrl = String(req.query?.media)
    const avatarTransform = String(req.query?.avatar) === 'true'

    if (!mediaUrl) {
      res.sendStatus(404)
      return
    }

    try {
      // TODO: to support bluesky images, we should receive full URLs built on frontend and not just cids
      if (mediaUrl.startsWith('?cid=')) {
        try {
          const did = decodeURIComponent(mediaUrl.split('&did=')[1])
          const cid = decodeURIComponent(mediaUrl.split('&did=')[0].split('?cid=')[1])
          if (!did || !cid) {
            return res.sendStatus(400)
          }

          const fileName = `cache/bsky_${cid}`
          if (fs.existsSync(fileName)) {
            return sendWithCache(res, fileName)
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

            const remoteResponse = await axios.get(url, {
              responseType: 'stream',
              headers: { 'User-Agent': environment.instanceUrl }
            })

            await writeStream(remoteResponse, fileName)
            return sendWithCache(res, fileName)
          }
        } catch (error) {
          logger.trace({
            message: 'error on cache with dids',
            url: req.query?.media,
            error: error
          })
          return res.sendStatus(500)
        }
      }

      // this urlBase will always reflect the starting URL requested from the client, the one that is in the browser, not the internal one behind the proxies
      const urlBase = req.protocol + '://' + req.get('host') + req.originalUrl
      // with the second parameter to the URL constructor we can provide a base URL in case the media URL is something like "/api/uploads/..." so the URL constructor does not throw an error
      const url = new URL(mediaUrl, urlBase)
      const mediaLink = url.href as string
      const mediaLinkArray = url.pathname.split('.')
      let linkExtension = mediaLinkArray[mediaLinkArray.length - 1].toLowerCase()

      // images from calckey and some other instances have no extension
      if (!url.pathname.includes('.')) {
        linkExtension = ''
      }

      const mediaLinkHash = crypto.createHash('sha256').update(mediaLink).digest('hex')
      let localFileName = await redisCache.get(`cache:${mediaLinkHash}`)

      if (!localFileName || !fs.existsSync(localFileName)) {
        const stream = await axios.get(mediaLink, {
          responseType: 'stream',
          headers: { 'User-Agent': environment.instanceUrl }
        })
        // read mime type (for the extension) from the headers of the remote response
        const mimeType = String(stream.headers['Content-Type'] || stream.headers['content-type'] || '')
        const ext = extensionFromMimeType(mimeType)
        localFileName = `cache/${mediaLinkHash}.${ext}`

        await redisCache.set(`cache:${mediaLinkHash}`, localFileName)
        await writeStream(stream, localFileName)
      }
      // at this point we have the file in the local file system and the hash-filename relation in the redis cache

      // if the avatarTransform flag is true, we need to optimize the file and save the optimized copy in the local file system
      if (avatarTransform) {
        const avatarFileName = `cache/avatars_${mediaLinkHash}.avif`
        if (fs.existsSync(avatarFileName)) {
          localFileName = avatarFileName
        } else {
          localFileName = await optimizeMedia(localFileName, {
            outPath: `cache/avatars_${mediaLinkHash}`,
            maxSize: 96,
            keep: true
          })
        }
      }

      return sendWithCache(res, localFileName)
    } catch (error) {
      logger.trace({
        message: 'error on cache',
        url: mediaUrl,
        error: error
      })
      return res.sendStatus(500)
    }
  })
}

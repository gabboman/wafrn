import express, { Application, Express, Request, Response } from 'express'
import crypto from 'crypto'
import fs from 'fs'
import axios from 'axios'
import { logger } from '../utils/logger.js'
import optimizeMedia from '../utils/optimizeMedia.js'
import { environment } from '../environment.js'
import { Resolver, ServiceEndpoint } from 'did-resolver'
import { getResolver } from 'plc-did-resolver'

export default function cacheRoutes(app: Application) {
  app.get('/api/cache', async (req: Request, res: Response) => {
    try {
      if (req.query?.media) {
        // this urlBase will always reflect the starting URL requested from the client, the one that is in the browser, not the internal one behind the proxies
        const urlBase = req.protocol + '://' + req.get('host') + req.originalUrl
        // with the second parameter to the URL constructor we can provide a base URL in case the media URL is something like "/api/uploads/..." so the URL constructor does not throw an error
        const url = new URL(req.query.media, urlBase)
        // this is only useful for local development
        if (url.hostname === 'localhost' && url.pathname.startsWith('/api/uploads/')) {
          const localFileName = url.pathname.replace('/api/uploads/', 'uploads/')
          if (fs.existsSync(localFileName)) {
            res.set('Cache-control', 'public, max-age=3600')
            // We have the image! we just serve it
            res.sendFile(localFileName, { root: '.' })
            return
          } else {
            res.sendStatus(404)
            return
          }
        }
        const mediaLink = url.href as string
        const mediaLinkArray = mediaLink.split('.')
        let linkExtension = mediaLinkArray[mediaLinkArray.length - 1].toLowerCase().replaceAll('/', '_')
        if (linkExtension.includes('/')) {
          linkExtension = ''
        }
        linkExtension = linkExtension.split('?')[0].substring(0, 4)
        // calckey images have no extension
        const mediaLinkHash = crypto.createHash('sha256').update(mediaLink).digest('hex')
        const avatarFileName = 'cache/avatars_' + mediaLinkHash + '.avif'
        const localFileName = linkExtension ? `cache/${mediaLinkHash}.${linkExtension}` : `cache/${mediaLinkHash}`
        if (fs.existsSync(localFileName)) {
          if (req.query.avatar) {
            if (fs.existsSync(avatarFileName)) {
              res.set('Cache-control', 'public, max-age=3600')
              // We have the image! we just serve it
              res.sendFile(avatarFileName, { root: '.' })
            } else {
              let fileToSend = await optimizeMedia(localFileName, {
                outPath: `cache/avatars_${mediaLinkHash}`,
                maxSize: 96,
                keep: true
              })
              res.sendFile(fileToSend, { root: '.' })
            }
          } else {
            // we set some cache
            res.set('Cache-control', 'public, max-age=3600')
            // We have the image! we just serve it
            res.sendFile(localFileName, { root: '.' })
          }
        } else {
          const remoteResponse = await axios.get(mediaLink, {
            responseType: 'stream',
            headers: { 'User-Agent': environment.instanceUrl }
          })
          const path = `${localFileName}`
          const filePath = fs.createWriteStream(path)
          filePath.on('finish', async () => {
            // we set some cache
            res.set('Cache-control', 'public, max-age=3600')
            filePath.close()
            if (req.query.avatar) {
              let fileToSend = await optimizeMedia(localFileName, {
                outPath: `cache/avatars_${mediaLinkHash}`,
                maxSize: 96,
                keep: true
              })
              res.sendFile(fileToSend, { root: '.' })
            } else {
              res.sendFile(localFileName, { root: '.' })
            }
          })
          remoteResponse.data.pipe(filePath)
        }
      } else {
        res.sendStatus(404)
      }
    } catch (error) {
      // HACK this is DIRTY I should fix this
      const url = req.query.media ? (req.query.media as string) : ''
      if (url.startsWith('?cid=')) {
        try {
          const did = decodeURIComponent(url.split('&did=')[1])

          const cid = decodeURIComponent(url.split('&did=')[0].split('?cid=')[1])
          if (did && cid) {
            const fileName = `cache/bsky_${cid}`
            if (fs.existsSync(fileName)) {
              res.set('Cache-control', 'public, max-age=3600')
              // We have the image! we just serve it
              res.sendFile(fileName, { root: '.' })
            } else {
              let url: string
              let remoteResponse
              const plcResolver = getResolver()
              const didResolver = new Resolver({
                ...plcResolver
              })
              const didData = await didResolver.resolve(did)
              if (didData?.didDocument?.service) {
                url =
                  didData.didDocument.service[0].serviceEndpoint +
                  '/xrpc/com.atproto.sync.getBlob?did=' +
                  encodeURIComponent(did) +
                  '&cid=' +
                  encodeURIComponent(cid)
                remoteResponse = await axios.get(url, {
                  responseType: 'stream',
                  headers: { 'User-Agent': environment.instanceUrl }
                })
                const path = fileName
                const filePath = fs.createWriteStream(path)
                filePath.on('finish', async () => {
                  // we set some cache
                  res.set('Cache-control', 'public, max-age=3600')
                  filePath.close()

                  res.sendFile(fileName, { root: '.' })
                })
                remoteResponse.data.pipe(filePath)
              }
            }
          } else {
            res.sendStatus(400)
          }
        } catch (error) {
          logger.trace({
            message: 'error on cache with dids',
            url: req.query?.media,
            error: error
          })
          res.sendStatus(500)
        }
      } else {
        logger.trace({
          message: 'error on cache',
          url: req.query?.media,
          error: error
        })
        res.sendStatus(500)
      }
    }
  })
}

import express, { Application, Express, Request, Response } from 'express'
import crypto from 'crypto'
import fs from 'fs'
import axios from 'axios'
import { logger } from '../utils/logger'
const gm = require('gm')

export default function cacheRoutes(app: Application) {
  app.get('/api/cache', async (req: Request, res: Response) => {
    try {
      if (req.query?.media) {
        const mediaLink: string = new URL(req.query.media).href
        const mediaLinkArray = mediaLink.split('.')
        let linkExtension = mediaLinkArray[mediaLinkArray.length - 1].toLowerCase().replaceAll('/', '_')
        if (linkExtension.includes('/')) {
          linkExtension = ''
        }
        linkExtension = linkExtension.split('?')[0].substring(0, 4)
        // calckey images have no extension
        const mediaLinkHash = crypto.createHash('sha256').update(mediaLink).digest('hex')
        const avatarFileName = 'cache/avatars/' + mediaLinkHash + '.avif';
        const localFileName = linkExtension ? `cache/${mediaLinkHash}.${linkExtension}` : `cache/${mediaLinkHash}`
        if (fs.existsSync(localFileName)) {
          if(req.query.avatar) {
            if(fs.existsSync(avatarFileName)) {
              res.set('Cache-control', 'public, max-age=3600')
            // We have the image! we just serve it
            res.sendFile(avatarFileName, { root: '.' })
            } else {
              gm(localFileName)
              .autoOrient()
              .quality(75)
              .noProfile()
              .resize(96, 96)
              .write(avatarFileName, (err: any) => {
                if(err) {
                  logger.trace({
                    message: `Error converting file for small avatar`,
                    error: err
                  })
                } else {
                  res.set('Cache-control', 'public, max-age=3600')
                  // We have the image! we just serve it
                  res.sendFile(avatarFileName, { root: '.' })
                }
              })
            }
          } else {
          // we set some cache
          res.set('Cache-control', 'public, max-age=3600')
          // We have the image! we just serve it
          res.sendFile(localFileName, { root: '.' })
          }

        } else {
          const remoteResponse = await axios.get(mediaLink, { responseType: 'stream' })
          const path = `${localFileName}`
          const filePath = fs.createWriteStream(path)
          filePath.on('finish', () => {
            // we set some cache
            res.set('Cache-control', 'public, max-age=3600')
            filePath.close()
            if(req.query.avatar) {

              gm(localFileName)
              .autoOrient()
              .quality(90)
              .noProfile()
              .resize(96, 96)
              .write(avatarFileName, (err: any) => {
                if(err) {
                  logger.trace({
                    message: `Error converting file for small avatar`,
                    error: err
                  })
                } else {
                  res.set('Cache-control', 'public, max-age=3600')
                  // We have the image! we just serve it
                  res.sendFile(avatarFileName, { root: '.' })
                }
              })

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
      logger.trace({
        message: 'error on cache',
        url: req.query?.media,
        error: error
      })
    }
  })
}
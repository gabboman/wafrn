import express, { Application, Express, Request, Response } from 'express'
import crypto from 'crypto'
import fs from 'fs'
import axios from 'axios'
import { logger } from '../utils/logger'
export default function cacheRoutes(app: Application) {
  app.get('/api/cache', async (req: Request, res: Response) => {
    if (req.query?.media) {
      const mediaLink: string = req.query.media as string
      const mediaLinkArray = mediaLink.split('.')
      let linkExtension = mediaLinkArray[mediaLinkArray.length - 1].toLowerCase()
      if (linkExtension.includes('/')) {
        linkExtension = ''
      }
      // calckey images have no extension
      const mediaLinkHash = crypto.createHash('sha256').update(mediaLink).digest('hex')
      const localFileName = linkExtension ? `cache/${mediaLinkHash}.${linkExtension}` : `cache/${mediaLinkHash}`
      if (fs.existsSync(localFileName)) {
        // we set some cache
        res.set('Cache-control', 'public, max-age=3600')
        // We have the image! we just serve it
        res.sendFile(localFileName, { root: '.' })
      } else {
        // its downloading time!
        try {
          const remoteResponse = await axios.get(mediaLink, { responseType: 'stream' })
          const path = `${localFileName}`
          const filePath = fs.createWriteStream(path)
          filePath.on('finish', () => {
            // we set some cache
            res.set('Cache-control', 'public, max-age=3600')
            filePath.close()
            res.sendFile(localFileName, { root: '.' })
          })
          remoteResponse.data.pipe(filePath)
        } catch (error) {
          logger.trace(error)
          res.sendStatus(404)
        }
      }
    } else {
      res.sendStatus(404)
    }
  })
}

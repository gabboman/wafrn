/* eslint-disable max-len */
import { Application, Response } from 'express'
import { Media } from '../db'
import uploadHandler from '../utils/uploads'
import { authenticateToken } from '../utils/authenticateToken'

import getIp from '../utils/getIP'
import optimizeMedia from '../utils/optimizeMedia'
import { environment } from '../environment'
import { logger } from '../utils/logger'
import AuthorizedRequest from '../interfaces/authorizedRequest'

export default function mediaRoutes(app: Application) {
  app.post(
    '/api/uploadMedia',
    authenticateToken,
    uploadHandler().array('image'),
    async (req: AuthorizedRequest, res: Response) => {
      let result = []
      const picturesPromise = [] as Array<Promise<any>>

      if (req.files != null) {
        const files = req.files as Express.Multer.File[]
        for (const file of files) {
          let fileUrl = `/${file.path}`
          const originalNameArray = fileUrl.split('.')
          const extension = originalNameArray[originalNameArray.length - 1].toLowerCase()
          const formatsToNotConvert = ['webp', 'aac', 'mp3', 'wav', 'ogg', 'oga', 'm4a', 'pdf']
          if (!formatsToNotConvert.includes(extension)) {
            fileUrl = `/${await optimizeMedia(file.path)}`
          }
          if (environment.removeFolderNameFromFileUploads) {
            fileUrl = fileUrl.slice('/uploads/'.length - 1)
          }

          const isAdultContent = req.body.adultContent === 'true'
          const isNSFW = req.body.nsfw === 'true'

          picturesPromise.push(
            Media.create({
              url: fileUrl,
              // if its marked as adult content it must be NSFW
              NSFW: isAdultContent ? true : isNSFW,
              userId: req.jwtData?.userId,
              description: req.body.description,
              ipUpload: getIp(req),
              adultContent: isAdultContent
            })
          )
        }

        result = await Promise.all(picturesPromise)
      }

      res.send(result)
    }
  )

  app.get('/api/updateMedia', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const posterId = req.jwtData?.userId
      if (req.query?.id) {
        const mediaToUpdate = await Media.findOne({
          where: {
            id: req.query.id,
            userId: posterId
          }
        })
        if (mediaToUpdate) {
          mediaToUpdate.NSFW = req.query.adultContent === 'true' ? true : req.query.NSFW === 'true'
          mediaToUpdate.adultContent = req.query.adultContent === 'true'
          mediaToUpdate.description = req.query.description
          await mediaToUpdate.save()
          success = true
        }
      }
    } catch (error) {
      logger.error(error)
    }

    res.send({
      success
    })
  })
}

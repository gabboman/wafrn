import { Application, Response } from "express";
import { adminToken, authenticateToken } from "../utils/authenticateToken";
import AuthorizedRequest from '../interfaces/authorizedRequest'
import uploadHandler from "../utils/uploads";
import multer from 'multer'
import * as fs from 'fs-extra'
import {Extract} from 'unzip-stream'
import { Emoji, EmojiCollection } from "../db";
import { logger } from "../utils/logger";
import { wait } from "../utils/wait";
const emojiStorage = multer.diskStorage({
    destination: '/tmp/',
    filename: (req, file, cb) => {
      const originalNameArray = file.originalname.split('.')
      const extension = originalNameArray[originalNameArray.length - 1]
      cb(null, `${Date.now()}_emoji.${extension.toLocaleLowerCase()}`)
    }
  })



export default function emojiRoutes(app: Application) {
    app.post(
        '/api/admin/addEmoji',
        authenticateToken,
        adminToken,
        uploadHandler(/\.(zip)$/, emojiStorage).single('emoji'),
        async (req: AuthorizedRequest, res: Response) => {
          const file = req.file as Express.Multer.File
          const packName = file.originalname.replaceAll('.zip','').replaceAll('.', '').replaceAll('/', '').replaceAll(' ', '_')
          const existingCollection = await EmojiCollection.findAll({
            where: {
              name: packName
            }
          })
          if(existingCollection && existingCollection.length){
            res.send({
              success: false,
              message: 'Existing pack'
            })
          } else {
            try {
              fs.createReadStream(file.destination + file.filename).on('end', async () => {
                const pack = await EmojiCollection.create({
                  name: packName
                })
                const fileFormats = /.(jpg|gif|png|webp)$/
                const emojinames = fs.readdirSync('./uploads/emojipacks/' + packName).filter(filename => filename.toLowerCase().match(fileFormats))
                const emojisToCreate = emojinames.map(elem => {
                  const emojiName = `:${elem.split('.')[0]}:`
                  return {
                  name: emojiName ,
                  external: false,
                  url: `/emojipacks/${packName}/${elem}`,
                  id: emojiName,
                  emojiCollectionId: pack.id
                }})
                const emojisCreated = await Emoji.bulkCreate(emojisToCreate)
                res.send({
                  success: true,
                  message: 'Pack created succesfuly'
                })
              }).pipe(Extract({ path: './uploads/emojipacks/' + packName }))
            } catch (error) {
              logger.info({message: 'Error when creating emoji pack', error: error})
              res.send({
                success: false,
                message: 'something went wrong. Check logs'
              })
            }
            
          }
          
        })
}
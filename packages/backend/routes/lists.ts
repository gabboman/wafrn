import { Application, Response } from 'express'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import { authenticateToken } from '../utils/authenticateToken'
import uploadHandler from '../utils/uploads'
import fs from 'fs/promises'
import parse from 'csv-parse'
import { environment } from '../environment'
import { Follows, User, sequelize } from '../db'
import { Op } from 'sequelize'
import { searchRemoteUser } from '../utils/activitypub/searchRemoteUser'
import { follow } from '../utils/follow'
export default function listRoutes(app: Application) {
  // Recomended users to follow
  app.post(
    '/api/loadFollowList',
    authenticateToken,
    uploadHandler(/\.(csv)$/).single('follows'),
    async (req: AuthorizedRequest, res: Response) => {
      if (req.file) {
        try {
          const petitionBy = await User.findByPk(req.jwtData?.userId)
          const lines: string[] = (await fs.readFile(req.file.path, 'utf8'))
            .split('\n')
            .map((elem) => elem.split(',')[0])
            .slice(1)
          const okUsers: string[] = []
          const localUsersUrls = lines
            .filter((elem) => elem.endsWith('@' + environment.instanceUrl))
            .map((elem) => elem.split('@')[0].toLowerCase())
          const remoteUsersUrls = lines
            .filter((elem) => !elem.endsWith('@' + environment.instanceUrl))
            .map((url) => '@' + url)
          const allUsers = localUsersUrls.concat(remoteUsersUrls)
          let foundUsers = await User.findAll({
            where: {
              url: {
                [Op.in]: allUsers
              }
            }
          })
          let foundUsersUrls = foundUsers.map((elem: any) => elem.url)
          let notFoundUsersUrls = allUsers.filter((elem) => !foundUsersUrls.includes(elem))
          const notFoundUsersToFetch = notFoundUsersUrls.filter((elem) => !localUsersUrls.includes(elem))
          // try to get all users
          const userFetchPromise = await Promise.allSettled(
            notFoundUsersToFetch.map((usr) => searchRemoteUser(`@${usr}`, petitionBy))
          )
          foundUsers = await User.findAll({
            where: {
              url: {
                [Op.in]: allUsers
              }
            }
          })
          foundUsersUrls = foundUsers.map((elem: any) => elem.url)
          notFoundUsersUrls = allUsers.filter((elem) => !foundUsersUrls.includes(elem))
          res.send({
            foundUsers: foundUsers.map((elem: any) => {
              return {
                url: elem.url,
                avatar: elem.avatar,
                name: elem.name,
                id: elem.id
              }
            }),
            notFoundUsers: notFoundUsersUrls
          })
        } catch (error: any) {
          res.send({
            success: false,
            errorMessage: error.message
          })
          await fs.unlink(req.file.path)
        }
      } else {
        res.sendStatus(500)
      }
    }
  )
}

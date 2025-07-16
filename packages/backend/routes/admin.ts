import { Application, Response } from 'express'
import { adminToken, authenticateToken } from '../utils/authenticateToken.js'
import { Blocks, FederatedHost, Post, PostReport, ServerBlock, User, sequelize } from '../models/index.js'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import { server } from '../interfaces/server.js'
import { Op, WhereOptions } from 'sequelize'
import { redisCache } from '../utils/redis.js'
import sendActivationEmail from '../utils/sendActivationEmail.js'
import { UserAttributes } from '../models/user.js'
import { completeEnvironment } from '../utils/backendOptions.js'

export default function adminRoutes(app: Application) {
  app.get('/api/admin/server-list', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    res.send({
      servers: await FederatedHost.findAll()
    })
  })
  app.post('/api/admin/server-update', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    const petitionBody: Array<server> = req.body
    if (petitionBody) {
      const hostsToUpdateIds = petitionBody.map((elem) => elem.id)
      const dbElements = await FederatedHost.findAll({
        where: {
          id: {
            [Op.in]: hostsToUpdateIds
          }
        }
      })
      let promises: Array<Promise<any>> = []
      dbElements.forEach(async (elemToUpdate: any) => {
        const newValue = petitionBody.find((elem) => elem.id === elemToUpdate.id)
        if (newValue) {
          elemToUpdate.bubbleTimeline = newValue.bubbleTimeline
          elemToUpdate.blocked = newValue.blocked
          elemToUpdate.detail = newValue.detail
          elemToUpdate.friendServer = newValue.friendServer
          promises.push(elemToUpdate.save())
          if (elemToUpdate.blocked) {
            // we add it to the blocked cache
            redisCache.set('server:' + elemToUpdate.displayName, 'true')
          } else {
            // we remove it from the blocked cache
            redisCache.set('server:' + elemToUpdate.displayName, 'false')
          }
          if (newValue.blocked) {
            const reportsToClose = await PostReport.findAll({
              include: [
                {
                  model: Post,
                  include: [
                    {
                      model: User,
                      as: 'user',
                      include: [
                        {
                          model: FederatedHost,
                          required: true,
                          where: {
                            id: elemToUpdate.id
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            })
            promises = promises.concat(reportsToClose?.map((report: any) => report.update({ resolved: true })))
          }
        }
      })
      await Promise.all(promises)
      await redisCache.del('allBlockedServers')
      res.send({})
    } else {
      res.send({})
    }
  })

  app.get('/api/admin/userBlockList', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    res.send({
      userBlocks: await Blocks.findAll({
        include: [
          {
            model: User,
            as: 'blocker',
            attributes: ['url', 'avatar']
          },
          {
            model: User,
            as: 'blocked',
            attributes: ['url', 'avatar']
          }
        ]
      }),
      userServerBlocks: await ServerBlock.findAll({
        include: [
          {
            model: User,
            as: 'userBlocker',
            attributes: ['url', 'avatar']
          },
          {
            model: FederatedHost,
            as: 'blockedServer',
            attributes: ['displayName']
          }
        ]
      })
    })
  })

  app.get('/api/admin/reportCount', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    res.send({
      reports: await PostReport.count({
        where: {
          resolved: false
        }
      })
    })
  })

  async function getReportList() {
    // god forgive me for the any
    let res = await PostReport.findAll({
      include: [
        {
          model: User,
          attributes: ['url', 'avatar', 'id']
        },
        {
          model: Post,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['url', 'avatar', 'id'],
              include: [
                {
                  model: FederatedHost,
                  attributes: ['id', 'displayName']
                }
              ]
            }
          ]
        }
      ]
    })
    // this is not the best way to do this. But this code doesnt get caled that much
    // also im sleepy and i have other things to do
    // so
    // TODO make this in a better way. You, unsuspecting person, do this properly!
    const reportsWithoutPost = res.filter((elem) => !elem.post)
    const usersToFillIds = reportsWithoutPost.map((elem) => elem.reportedUserId).filter((elem) => !!elem)
    const usersToFill = await User.findAll({
      attributes: ['url', 'avatar', 'id'],
      where: {
        id: {
          [Op.in]: usersToFillIds
        }
      }
    })
    const userMap: Map<string, User> = new Map()
    usersToFill.forEach((elem) => {
      userMap.set(elem.id, elem)
    })

    return res.map((elem) => {
      let reporteduser = elem.post ? elem.post.user : (userMap.get(elem.reportedUserId) as User)
      return {
        id: elem.id,
        resolved: elem.resolved,
        severity: elem.severity,
        description: elem.description,
        userId: elem.userId,
        user: elem.user,
        postId: elem.postId,
        post: elem.post,
        reportedUserId: elem.reportedUserId ? elem.reportedUserId : elem.post.userId,
        reportedUser: reporteduser
      }
    })
  }

  app.get('/api/admin/reportList', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    res.send(await getReportList())
  })

  app.post('/api/admin/closeReport', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    const reportToBeClosed = await PostReport.findByPk(req.body.id)
    if (reportToBeClosed) {
      reportToBeClosed.resolved = true
      await reportToBeClosed.save()
    }
    res.send(await getReportList())
  })

  app.post('/api/admin/banUser', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    const userToBeBanned = await User.findByPk(req.body.id)
    if (userToBeBanned && userToBeBanned.role != 10) {
      userToBeBanned.banned = true
      await userToBeBanned.save()
      // TOO fix this dirty thing oh my god
      const unsolvedReports = await PostReport.findAll({
        where: {
          resolved: false
        },
        include: [
          {
            model: Post,
            where: {
              userId: req.body.id
            }
          }
        ]
      })
      if (unsolvedReports) {
        await Promise.allSettled(
          unsolvedReports.map((elem: any) => {
            elem.resolved = true
            return elem.save()
          })
        )
      }
    }

    res.send({
      success: true
    })
  })

  app.post('/api/admin/ignoreReport', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    res.send(
      await PostReport.update(
        {
          resolved: true
        },
        {
          where: {
            id: req.body.id
          }
        }
      )
    )
  })

  async function getBannedUsers() {
    return await User.findAll({
      where: {
        banned: true
      },
      attributes: ['id', 'url', 'avatar']
    })
  }

  app.get('/api/admin/getBannedUsers', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    res.send({
      users: await getBannedUsers()
    })
  })

  app.post('/api/admin/unbanUser', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    await User.update(
      {
        banned: false
      },
      {
        where: {
          id: req.body.id
        }
      }
    )
    res.send({
      users: await getBannedUsers()
    })
  })

  app.get(
    '/api/admin/getPendingApprovalUsers',
    authenticateToken,
    adminToken,
    async (req: AuthorizedRequest, res: Response) => {
      const whereConditions: WhereOptions<UserAttributes> = {
        activated: false,
        url: {
          [Op.notLike]: '%@%'
        },
        banned: false
      }
      if (!completeEnvironment.disableRequireSendEmail) {
        whereConditions.emailVerified = true
      }
      const notActiveUsers = await User.findAll({
        where: whereConditions,
        attributes: ['id', 'url', 'avatar', 'description', 'email', 'registerIp']
      })
      res.send(notActiveUsers)
    }
  )

  app.post('/api/admin/activateUser', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    if (req.body.id) {
      const userToActivate = await User.findByPk(req.body.id)
      if (userToActivate && userToActivate.email) {
        userToActivate.activated = true
        const emailPromise = sendActivationEmail(
          userToActivate.email,
          '',
          `your account at ${completeEnvironment.frontendUrl} has been activated`,
          `Hello ${userToActivate.url}, your account has been reviewed by our team and is now activated! Congratulations`
        )
        Promise.allSettled([emailPromise, userToActivate.save()])
      }
    }
    res.send({ success: true })
  })

  app.post('/api/admin/userUsedVPN', authenticateToken, adminToken, async (req: AuthorizedRequest, res: Response) => {
    if (req.body.id) {
      const userToDelete = await User.findByPk(req.body.id)
      if (userToDelete && userToDelete.email) {
        const emailPromise = sendActivationEmail(
          userToDelete.email,
          '',
          `Registrations at ${completeEnvironment.frontendUrl} with vpn are not allowed`,
          `<h1>Hello ${userToDelete.url}, we have got a lot of spammers registering with vpns.</h1>
          <p>Please do <a href="${completeEnvironment.frontendUrl}/register">try registering again without a vpn</a> or <b>on a different internet connection</b>. Corporate work networks usualy get flagged as VPN</p>
          <p>This is one of the many ways we avoid spam.</p>
          <p>There is also only so much gore you can see before you say “fuck this shit”.</p>
          <p>I am sorry. I promise that I won't do evil shit with your data, nor will i sell it or anything.</p>
          <p>I have freed up your email if you want to join again without a vpn.</p>
          <p>Thanks for your understanding and we're sorry</p>
          `
        )
        await userToDelete.destroy()
        Promise.allSettled([emailPromise])
      }
    }
    res.send({ success: true })
  })

  app.post(
    '/api/admin/notActivateAndSendEmail',
    authenticateToken,
    adminToken,
    async (req: AuthorizedRequest, res: Response) => {
      if (req.body.id) {
        const userToActivate = await User.findByPk(req.body.id)
        if (userToActivate && userToActivate.email) {
          userToActivate.activated = null // little hack, not adding another thing to the db. we set it to null and remove notification
          userToActivate.banned = null
          const emailPromise = sendActivationEmail(
            userToActivate.email,
            '',
            `Hello ${userToActivate.url}, before we can activate your account at ${completeEnvironment.frontendUrl} we need you to reply to this email`,
            `Hello ${userToActivate.url}, you recived this email because something might be off in your account. Usually is something like the email being in a strange provider or 'wow that email looks weird'. We just need a confirmation. Sorry for this and thanks.`
          )
          Promise.allSettled([userToActivate.save(), emailPromise])
        }
      }
      res.send({ success: true })
    }
  )
}

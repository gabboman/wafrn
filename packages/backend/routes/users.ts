import { Application, Response } from 'express'
import { Model, Op } from 'sequelize'
import {
  Ask,
  Blocks,
  BskyInviteCodes,
  Emoji,
  FederatedHost,
  Follows,
  MfaDetails,
  Mutes,
  Post,
  ServerBlock,
  User,
  UserBookmarkedPosts,
  UserEmojiRelation,
  UserOptions
} from '../models/index.js'
import { authenticateToken } from '../utils/authenticateToken.js'

import generateRandomString from '../utils/generateRandomString.js'
import getIp from '../utils/getIP.js'
import sendActivationEmail from '../utils/sendActivationEmail.js'
import validateEmail from '../utils/validateEmail.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sequelize } from '../models/index.js'

import optimizeMedia from '../utils/optimizeMedia.js'
import uploadHandler from '../utils/uploads.js'
import { generateKeyPairSync } from 'crypto'
import { environment } from '../environment.js'
import { logger } from '../utils/logger.js'
import { createAccountLimiter, loginRateLimiter } from '../utils/rateLimiters.js'
import fs from 'fs/promises'
import AuthorizedRequest from '../interfaces/authorizedRequest.js'
import optionalAuthentication from '../utils/optionalAuthentication.js'
import checkIpBlocked from '../utils/checkIpBlocked.js'
import { redisCache } from '../utils/redis.js'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds.js'
import getBlockedIds from '../utils/cacheGetters/getBlockedIds.js'
import { getNotYetAcceptedFollowedids } from '../utils/cacheGetters/getNotYetAcceptedFollowedIds.js'
import { getUserOptions } from '../utils/cacheGetters/getUserOptions.js'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts.js'
import { getAvaiableEmojis } from '../utils/getAvaiableEmojis.js'
import { getMutedUsers } from '../utils/cacheGetters/getMutedUsers.js'
import { getAvaiableEmojisCache } from '../utils/cacheGetters/getAvaiableEmojis.js'
import { rejectremoteFollow } from '../utils/activitypub/rejectRemoteFollow.js'
import { acceptRemoteFollow } from '../utils/activitypub/acceptRemoteFollow.js'
import showdown from 'showdown'
import { BskyAgent, ComNS } from '@atproto/api'
import { getAtProtoSession } from '../atproto/utils/getAtProtoSession.js'
import { forceUpdateCacheDidsAtThread, getCacheAtDids } from '../atproto/cache/getCacheAtDids.js'
import dompurify from 'isomorphic-dompurify'
import { Queue } from 'bullmq'
import * as OTPAuth from 'otpauth'
import verifyTotp from '../utils/verifyTotp.js'

const markdownConverter = new showdown.Converter({
  simplifiedAutoLink: true,
  literalMidWordUnderscores: true,
  strikethrough: true,
  simpleLineBreaks: true,
  openLinksInNewWindow: true,
  emoji: true
})
const forbiddenCharacters = [':', '@', '/', '<', '>', '"', '&', '?']

const generateUserKeyPairQueue = new Queue('generateUserKeyPair', {
  connection: environment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: 25000
  }
})

export default function userRoutes(app: Application) {
  app.post(
    '/api/register',

    createAccountLimiter,
    uploadHandler().single('avatar'),
    async (req, res) => {
      try {
        let success = false
        if (
          req.body?.email &&
          req.body.url &&
          req.body.url.match(/^[a-z0-9_A-Z]+([\_-]+[a-z0-9_A-Z]+)*$/i) &&
          validateEmail(req.body.email)
        ) {
          const birthDate = new Date(req.body.birthDate)
          const minimumAge = new Date()
          minimumAge.setFullYear(new Date().getFullYear() - 18)
          if (birthDate.getTime() > minimumAge.getTime()) {
            res.status(403).send({ success: false, error: true, message: 'Invalid age' })
            return
          }
          const emailExists = await User.findOne({
            where: {
              [Op.or]: [
                { email: req.body.email.toLowerCase() },
                sequelize.where(sequelize.fn('lower', sequelize.col('url')), req.body.url.toLowerCase())
              ]
            }
          })
          if (!emailExists) {
            let avatarURL = '' // Empty user avatar in case of error let frontend do stuff
            if (req.file != null) {
              avatarURL = `/${await optimizeMedia(req.file.path, { forceImageExtension: 'webp' })}`
            }
            if (environment.removeFolderNameFromFileUploads) {
              avatarURL = avatarURL.slice('/uploads/'.length - 1)
            }
            const activationCode = generateRandomString()
            const user = {
              email: req.body.email.toLowerCase(),
              description: req.body.description.trim(),
              descriptionMarkdown: markdownConverter.makeHtml(req.body.description.trim()),
              url: req.body.url.trim().replace(' ', '_'),
              name: req.body.name ? req.body.name : req.body.url.trim().replace(' ', '_'),
              NSFW: req.body.nsfw === 'true',
              password: await bcrypt.hash(req.body.password, environment.saltRounds),
              birthDate: new Date(req.body.birthDate),
              avatar: avatarURL,
              activated: false,
              registerIp: getIp(req, true),
              lastLoginIp: 'ACCOUNT_NOT_ACTIVATED',
              banned: false,
              activationCode,
              isBot: false,
              lastTimeNotificationsCheck: new Date(0),
              lastActiveAt: new Date(0),
              hideProfileNotLoggedIn: false,
              hideFollows: false,
              emailVerified: false
            }

            const userWithEmail = User.create(user)
            const mailHeader = `Welcome to ${environment.instanceUrl}, please verify your email!`
            const mailBody = `<h1>Welcome to ${environment.instanceUrl}</h1> To verify your email <a href="${
              environment.instanceUrl
            }/activate/${encodeURIComponent(
              req.body.email.toLowerCase()
            )}/${activationCode}">click here!</a>. If you can not see the link correctly please copy this link:
            ${environment.instanceUrl}/activate/${encodeURIComponent(req.body.email.toLowerCase())}/${activationCode}
            `
            const emailSent = environment.disableRequireSendEmail
              ? true
              : sendActivationEmail(req.body.email.toLowerCase(), activationCode, mailHeader, mailBody)
            await Promise.all([userWithEmail, emailSent])
            await generateUserKeyPairQueue.add('generateUserKeyPair', { userId: (await userWithEmail).id })
            success = true
            await redisCache.del('allLocalUserIds')
            res.send({
              success: true
            })
          } else {
            logger.info({
              message: 'Email exists',
              email: req.body?.email,
              url: req.body.url,
              forbidChar: !forbiddenCharacters.some((char) => req.body.url.includes(char)),
              emailValid: validateEmail(req.body.email)
            })
          }
        } else {
          logger.info({
            message: 'Failed registration',
            email: req.body?.email,
            url: req.body.url,
            forbidChar: !forbiddenCharacters.some((char) => req.body.url.includes(char)),
            emailValid: validateEmail(req.body.email)
          })
          res.status(400).send({ success: false })
          return
        }
        if (!success) {
          res.status(401).send({ success: false })
        }
      } catch (error) {
        logger.error(error)
        res.status(500).send({ success: false })
      }
    }
  )

  app.post('/api/updateCSS', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const posterId = req.jwtData?.userId
    if (req.body.css) {
      try {
        await fs.writeFile(`uploads/themes/${posterId}.css`, req.body.css)
        res.send({ success: true })
      } catch (error) {
        logger.warn(error)
        res.status(500)
        res.send({ error: true })
      }
    } else {
      res.sendStatus(500)
    }
  })

  app.post(
    '/api/editProfile',
    authenticateToken,
    uploadHandler().fields([
      { name: 'avatar', maxCount: 1 },
      { name: 'headerImage', maxCount: 1 }
    ]),
    async (req: AuthorizedRequest, res: Response) => {
      let success = false
      try {
        const posterId = req.jwtData?.userId as string
        const user = await User.findOne({
          where: {
            id: posterId
          }
        })
        if (req.body && user) {
          const {
            hideFollows,
            hideProfileNotLoggedIn,
            name,
            description,
            manuallyAcceptsFollows,
            options: optionJSON
          } = req.body

          const avaiableEmojis = await getAvaiableEmojis()
          let userEmojis: any[] = []
          user.manuallyAcceptsFollows = manuallyAcceptsFollows == 'true'
          user.hideFollows = hideFollows == 'true'
          user.hideProfileNotLoggedIn = hideProfileNotLoggedIn == 'true'
          user.disableEmailNotifications = req.body.disableEmailNotifications == 'true'
          if (description) {
            const descriptionHtml = markdownConverter.makeHtml(description)
            user.description = descriptionHtml
            user.descriptionMarkdown = description
            userEmojis = userEmojis.concat(avaiableEmojis?.filter((emoji: any) => description.includes(emoji.name)))
          }

          if (name) {
            user.name = name
            userEmojis = userEmojis.concat(avaiableEmojis?.filter((emoji: any) => name.includes(emoji.name)))
          }

          const avatar = (req?.files as any)?.avatar?.[0]
          const headerImage = (req?.files as any)?.headerImage?.[0]

          if (avatar != null) {
            let url = `/${await optimizeMedia(avatar.path, { forceImageExtension: 'webp' })}`
            if (environment.removeFolderNameFromFileUploads) {
              url = url.slice('/uploads/'.length - 1)
            }
            user.avatar = url
          }
          if (headerImage != null) {
            let url = `/${await optimizeMedia(headerImage.path, { forceImageExtension: 'webp' })}`
            if (environment.removeFolderNameFromFileUploads) {
              url = url.slice('/uploads/'.length - 1)
            }
            user.headerImage = url
          }

          await UserEmojiRelation.destroy({
            where: {
              userId: user.id
            }
          })
          await user.removeEmojis()
          user.setEmojis([...new Set(userEmojis)])
          redisCache.del('userOptions:' + posterId)
          await user.save()

          await updateProfileOptions(optionJSON, posterId)
          if (user.enableBsky) {
            const bskySession = await getAtProtoSession(user)
            await updateBlueskyProfile(bskySession, user)
          }
          success = true
          await redisCache.del('fediverse:user:base:' + posterId)
        }
      } catch (error) {
        logger.error(error)
      }

      res.send({
        success
      })
    }
  )

  app.post('/api/editOptions', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      const userId = req.jwtData?.userId
      const options = req.body.options
      if (userId && options) {
        await updateProfileOptions(JSON.stringify(options), userId)
      }
      await redisCache.del('userOptions:' + userId)
    } catch (error) {
      logger.info({
        message: 'Error updating user options',
        error: error
      })
    }
    res.send({ success: success })
  })

  app.post('/api/forgotPassword', createAccountLimiter, async (req, res) => {
    const resetCode = generateRandomString()
    try {
      if (req.body?.email && validateEmail(req.body.email)) {
        const email = req.body.email.toLowerCase()
        const user = await User.findOne({ where: { email } })
        if (user) {
          user.activationCode = resetCode
          user.requestedPasswordReset = new Date()
          user.save()

          const link = `${environment.instanceUrl}/resetPassword/${encodeURIComponent(email)}/${resetCode}`
          const appLink = `wafrn://complete-password-reset?email=${encodeURIComponent(email)}&code=${resetCode}`

          await sendActivationEmail(
            req.body.email.toLowerCase(),
            '',
            `So you forgot your ${environment.instanceUrl} password`,
            `
            <h1>Use this link to reset your password</h1>
            <p>
              Click <a href="${link}">here</a> to reset your password.
            </p>
            <p>
              Or copy this link: ${link}
            </p>
            <p>
              Or use this link for the wafrn mobile app
              <a href="${appLink}">${appLink}</a>
            </p>
            <p>
              If you didn't request this, please ignore this email.
            </p>
            `
          )
        }
      }
    } catch (error) {
      logger.error(error)
    }

    res.send({ success: true })
  })

  app.post('/api/activateUser', async (req, res) => {
    let success = false
    if (req.body?.email && validateEmail(req.body.email) && req.body.code) {
      const user = await User.findOne({
        where: {
          email: req.body.email.toLowerCase(),
          activationCode: req.body.code
        }
      })
      if (user) {
        user.emailVerified = true
        let emailBody = ''
        let emailSubject = ''
        if (!environment.reviewRegistrations) {
          user.activated = true
          emailSubject = 'Your wafrn account has been activated!'
          emailBody = ';D'
        } else {
          emailBody =
            'Hello, thanks for confirming your email address. The admin team will review your registration and will be aproved shortly'
          emailSubject = 'Thanks for verifying your email, Our admin team will review your registration request soon!'
        }

        await Promise.all([user.save(), sendActivationEmail(req.body.email.toLowerCase(), '', emailSubject, emailBody)])
        success = true
      }
    }

    res.send({
      success
    })
  })

  app.post('/api/resetPassword', async (req, res) => {
    let success = false

    try {
      if (req.body?.email && req.body.code && req.body.password && validateEmail(req.body.email)) {
        const resetPasswordDeadline = new Date()
        resetPasswordDeadline.setTime(resetPasswordDeadline.getTime() + 3600 * 2 * 1000)
        const user = await User.findOne({
          where: {
            email: req.body.email.toLowerCase(),
            activationCode: req.body.code,
            requestedPasswordReset: { [Op.lt]: resetPasswordDeadline }
          }
        })
        if (user) {
          user.password = await bcrypt.hash(req.body.password, environment.saltRounds)
          user.activated = environment.reviewRegistrations ? user.activated : true
          user.requestedPasswordReset = null
          await user.save()

          // also reset MFA details
          await MfaDetails.destroy({
            where: {
              userId: user.id
            }
          })

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

  app.post('/api/login', loginRateLimiter, async (req, res) => {
    let success = false
    try {
      if (req.body?.email && req.body.password) {
        const userWithEmail = await User.findOne({
          where: {
            email: req.body.email.toLowerCase().trim(),
            banned: {
              [Op.ne]: true
            }
          }
        })
        if (userWithEmail && userWithEmail.email) {
          const correctPassword = await bcrypt.compare(req.body.password, userWithEmail.password)
          if (correctPassword) {
            success = true
            if (userWithEmail.activated) {
              const mfaEnabled = await MfaDetails.findAll({
                where: {
                  userId: userWithEmail.id,
                  enabled: {
                    [Op.eq]: true
                  }
                }
              })
              if (mfaEnabled.length > 0) {
                res.send({
                  success: true,
                  mfaRequired: true,
                  mfaOptions: [...new Set(mfaEnabled.map((elem) => elem.type))],
                  token: jwt.sign(
                    {
                      mfaStep: 1,
                      email: userWithEmail.email.toLowerCase()
                    },
                    environment.jwtSecret,
                    { expiresIn: '300s' }
                  )
                })
              } else {
                res.send({
                  success: true,
                  token: jwt.sign(
                    {
                      userId: userWithEmail.id,
                      email: userWithEmail.email.toLowerCase(),
                      birthDate: userWithEmail.birthDate,
                      url: userWithEmail.url,
                      role: userWithEmail.role
                    },
                    environment.jwtSecret,
                    { expiresIn: '31536000s' }
                  )
                })
                userWithEmail.lastLoginIp = getIp(req, true)
                await userWithEmail.save()
              }
            } else {
              res.send({
                success: false,
                errorMessage: 'Please activate your account! Check your email'
              })
            }
          }
        }
      }
    } catch (error) {
      logger.error(error)
    }

    if (!success) {
      // res.statusCode = 401;
      res.send({
        success: false,
        errorMessage: 'Please recheck your email and password'
      })
    }
  })

  app.post('/api/login/mfa', [loginRateLimiter, optionalAuthentication], async (req: AuthorizedRequest, res: any) => {
    let success = false
    try {
      if (req.body?.token && req.jwtData?.mfaStep == 1 && req.jwtData?.email) {
        const userWithEmail = await User.findOne({
          where: {
            email: req.jwtData?.email,
            banned: {
              [Op.ne]: true
            }
          }
        })
        if (userWithEmail) {
          const mfaDetails = await MfaDetails.findAll({
            where: {
              userId: userWithEmail.id,
              enabled: {
                [Op.eq]: true
              }
            }
          })

          let mfaPassed = false

          for (let mfaDetail of mfaDetails) {
            if (await verifyTotp(mfaDetail, req.body?.token)) {
              mfaPassed = true
              break
            }
          }

          if (mfaPassed) {
            success = true
            res.send({
              success: true,
              token: jwt.sign(
                {
                  userId: userWithEmail.id,
                  email: userWithEmail.email?.toLowerCase(),
                  birthDate: userWithEmail.birthDate,
                  url: userWithEmail.url,
                  role: userWithEmail.role
                },
                environment.jwtSecret,
                { expiresIn: '31536000s' }
              )
            })
            userWithEmail.lastLoginIp = getIp(req, true)
            await userWithEmail.save()
          }
        }
      }
    } catch (error) {
      logger.error(error)
    }

    if (!success) {
      // res.statusCode = 401;
      res.send({
        success: false,
        errorMessage: 'Invalid code provided'
      })
    }
  })

  // list all registered MFA options for a user
  app.get('/api/user/mfa', authenticateToken, async (req: AuthorizedRequest, res) => {
    if (req.jwtData?.userId) {
      try {
        const mfaDetails = await MfaDetails.findAll({
          where: {
            userId: req.jwtData?.userId,
            enabled: {
              [Op.eq]: true
            }
          }
        })
        res.send({
          success: true,
          mfa: mfaDetails.map((detail) => ({
            id: detail.id,
            name: detail.name,
            type: detail.type,
            enabled: detail.enabled
          }))
        })
        return
      } catch (error) {
        logger.error(error)
      }
    }
    res.send({ success: false })
  })

  app.post('/api/user/mfa', authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      if (req.jwtData?.userId && req.body?.type == 'totp') {
        const totpSettings: any = {
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: new OTPAuth.Secret({ size: 20 }).base32
        }

        const mfaDetail = await MfaDetails.create({
          userId: req.jwtData?.userId,
          type: 'totp',
          name: req.body?.name || 'Authenticator App',
          data: totpSettings,
          enabled: false
        })

        totpSettings.issuer = environment.instanceUrl
        totpSettings.label = req.jwtData?.email

        const totp = new OTPAuth.TOTP(totpSettings)

        res.send({
          success: true,
          mfa: {
            id: mfaDetail.id,
            type: mfaDetail.type,
            name: mfaDetail.name,
            secret: totpSettings.secret,
            qrString: totp.toString()
          }
        })
        return
      }
    } catch (error) {
      logger.error(error)
    }
    res.send({ success: false })
  })

  app.post('/api/user/mfa/:id/verify', authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      if (req.jwtData?.userId && req.body?.token) {
        const mfaDetail = await MfaDetails.findOne({
          where: {
            id: req.params.id,
            userId: req.jwtData?.userId,
            enabled: {
              [Op.eq]: false
            }
          }
        })
        if (mfaDetail) {
          if (await verifyTotp(mfaDetail, req.body?.token)) {
            mfaDetail.enabled = true
            await mfaDetail.save()
            res.send({ success: true })
            return
          }
        }
      }
    } catch (error) {
      logger.error(error)
    }
    res.send({ success: false })
  })

  app.delete('/api/user/mfa/:id', authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      if (req.jwtData?.userId) {
        const mfaDetail = await MfaDetails.findOne({
          where: {
            id: req.params.id,
            userId: req.jwtData?.userId
          }
        })
        if (mfaDetail) {
          await mfaDetail.destroy()
          res.send({ success: true })
          return
        }
      }
    } catch (error) {
      logger.error(error)
    }
    res.send({ success: false })
  })

  app.get('/api/user', optionalAuthentication, async (req: AuthorizedRequest, res) => {
    let success = false
    if (req.query?.id) {
      const userId = req.jwtData?.userId ? req.jwtData?.userId : '00000000-0000-0000-0000-000000000000'
      const blogId: string = (req.query.id || '').toString().toLowerCase().trim()
      const blog = await User.findOne({
        attributes: [
          'id',
          'url',
          'name',
          'createdAt',
          'description',
          'descriptionMarkdown',
          'remoteId',
          'avatar',
          'federatedHostId',
          'headerImage',
          'followingCount',
          'followerCount',
          'manuallyAcceptsFollows',
          'bskyDid',
          'isFediverseUser',
          'isBlueskyUser',
          [sequelize.literal(`"id" = '${userId}' AND "enableBsky"`), 'enableBsky'],
          [sequelize.literal(`"id" = '${userId}' AND "disableEmailNotifications"`), 'disableEmailNotifications'],
          [sequelize.literal(`"id" = '${userId}' AND "hideProfileNotLoggedIn"`), 'hideProfileNotLoggedIn'],
          [sequelize.literal(`"id" = '${userId}' AND "hideFollows"`), 'hideFollows']
        ],
        include: [
          {
            model: Emoji,
            required: false
          },
          {
            model: FederatedHost,
            required: false
          }
        ],
        where: {
          [Op.or]: [
            sequelize.where(sequelize.fn('lower', sequelize.col('url')), blogId),
            {
              bskyDid: blogId
            }
          ],
          banned: {
            [Op.ne]: true
          }
        }
      })
      if (blog && !req.jwtData) {
        const user = await User.findByPk(blog.id, { attributes: ['hideProfileNotLoggedIn'] })
        if (user?.hideProfileNotLoggedIn) {
          res.sendStatus(404)
          return
        }
      }
      if (!blog || blog.federatedHost?.blocked) {
        res.sendStatus(404)
        return
      }
      let followed = blog.url.startsWith('@')
        ? blog.followingCount
        : Follows.count({
            where: {
              followerId: blog.id,
              accepted: true
            }
          })
      let followers = blog.url.startsWith('@')
        ? blog.followerCount
        : Follows.count({
            where: {
              followedId: blog.id,
              accepted: true
            }
          })
      const publicOptions = UserOptions.findAll({
        where: {
          userId: blog.id,
          public: true
        }
      })
      let muted = false
      let blocked = false
      let serverBlocked = false || blog?.federatedHost?.blocked
      if (req.jwtData?.userId && blog) {
        const mutedQuery = Mutes.count({
          where: {
            muterId: req.jwtData.userId,
            mutedId: blog.id
          }
        })
        const blockedQuery = Blocks.count({
          where: {
            blockerId: req.jwtData.userId,
            blockedId: blog.id
          }
        })
        const serverBlockedQuery = await ServerBlock.count({
          where: {
            userBlockerId: req.jwtData.userId as string,
            blockedServerId: blog.federatedHostId as string
          }
        })
        await Promise.all([mutedQuery, blockedQuery, serverBlockedQuery, followed, followers, publicOptions])
        muted = (await mutedQuery) === 1
        blocked = (await blockedQuery) === 1
        serverBlocked = serverBlocked || (await serverBlockedQuery) === 1
      } else {
        await Promise.all([followed, followers])
      }

      const postCount = blog
        ? await Post.count({
            where: {
              userId: blog.id
            }
          })
        : 0

      followed = await followed
      followers = await followers
      success = !!blog
      if (success) {
        res.send({
          ...blog.dataValues,
          isBlueskyUser: blog.isBlueskyUser,
          isFediverseUser: blog.isFediverseUser,
          postCount,
          muted,
          blocked,
          serverBlocked,
          followed,
          followers,
          publicOptions: await publicOptions
        })
      }
    }

    if (!success) {
      res.send({ success: false })
    }
  })

  app.get('/api/my-ui-options', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId as string
    const followedUsers = getFollowedsIds(userId)
    const blockedUsers = getBlockedIds(userId)
    const notAcceptedFollows = getNotYetAcceptedFollowedids(userId)
    const options = getUserOptions(userId)
    const localEmojis = getAvaiableEmojisCache()
    const mutedUsers = getMutedUsers(userId)
    let userPromise = User.findByPk(req.jwtData?.userId, {
      attributes: ['banned']
    })
    const silencedPosts = getMutedPosts(userId)
    Promise.all([
      userPromise,
      followedUsers,
      blockedUsers,
      notAcceptedFollows,
      options,
      silencedPosts,
      localEmojis,
      mutedUsers
    ])
    const user = await userPromise
    if (!user || user.banned) {
      res.sendStatus(401)
    } else {
      res.send({
        followedUsers: await followedUsers,
        blockedUsers: await blockedUsers,
        notAcceptedFollows: await notAcceptedFollows,
        options: await options,
        silencedPosts: await silencedPosts,
        emojis: await localEmojis,
        mutedUsers: await mutedUsers
      })
    }
  })

  app.post('/api/enable-bluesky', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    if (!environment.enableBsky) {
      res.status(500)
      res.send({
        error: true,
        message: `This instance does not have bluesky enabled at this moment`
      })
    }
    const userId = req.jwtData?.userId as string
    const user = await User.findByPk(userId)
    if (user && !user.enableBsky) {
      const inviteCode = await BskyInviteCodes.findOne()
      if (inviteCode) {
        try {
          const agent = new BskyAgent({
            service: 'https://' + environment.bskyPds
          })
          const sanitizedUrl = user.url.replaceAll('_', '-').replaceAll('.', '-')
          const bskyPassword = generateRandomString()
          await agent.createAccount({
            email: `${user.url}@${environment.instanceUrl}`,
            password: bskyPassword,
            handle: `${sanitizedUrl}.${environment.bskyPds}`,
            inviteCode: inviteCode.code
          })
          await inviteCode.destroy()
          const userDid = agent.assertDid
          user.bskyDid = userDid
          user.bskyAuthData = bskyPassword
          user.enableBsky = true
          await user.save()
          // now we have to set the profile user and stuff
          await updateBlueskyProfile(await getAtProtoSession(user), user)
          res.send({
            success: true,
            did: userDid
          })
        } catch (error) {
          res.status(500)
          res.send({
            error: true,
            message: `There was an error! Contact an admin for this`
          })
          logger.error({
            message: `Error activating bluesky for user ${user.url}`,
            error: error
          })
        }
      } else {
        //oh no no invite codes avaiable!!!!!!
        res.status(500)
        res.send({
          error: true,
          message: `Contact the administrator: no invite codes avaiable`
        })
      }
    } else {
      res.status(500)
      res.send({
        error: true,
        message: `You already have bluesky enabled`
      })
    }
  })

  app.get('/api/user/deleteFollow/:id', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId as string
    const forceUnfollowId = req.params?.id as string
    let success = false
    try {
      let follow = await Follows.findOne({
        where: {
          followerId: forceUnfollowId,
          followedId: userId
        }
      })
      if (follow) {
        if (follow.remoteFollowId) {
          await rejectremoteFollow(userId, forceUnfollowId)
        }
        await redisCache.del('follows:local:' + forceUnfollowId)
        await redisCache.del('follows:full:' + forceUnfollowId)
        await redisCache.del('follows:local:' + userId)
        await redisCache.del('follows:full:' + userId)
        await follow.destroy()
        success = true
      }
    } catch (error) {
      logger.debug({
        message: `Remote force unfollow failed`,
        error: error
      })
      success = false
      res.status(500)
    }
    res.send({ success: success })
  })

  app.get('/api/user/approveFollow/:id', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId as string
    const approvedFollower = req.params?.id as string
    let success = true
    try {
      let follow = await Follows.findOne({
        where: {
          followerId: approvedFollower,
          followedId: userId
        }
      })
      if (follow) {
        if (follow.remoteFollowId) {
          await acceptRemoteFollow(userId, approvedFollower)
        }
        follow.accepted = true
        await follow.save()
        await redisCache.del('follows:local:' + approvedFollower)
        await redisCache.del('follows:full:' + approvedFollower)
        await redisCache.del('follows:local:' + userId)
        await redisCache.del('follows:full:' + userId)
      }
    } catch (error) {
      logger.debug({
        message: `Accept follow failed`,
        error: error
      })
      success = false
      res.status(500)
    }
    res.send({ success: success })
  })

  app.get('/api/user/:url/follows', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const url = req.params?.url as string
    const followers = req.query?.followers === 'true'
    if (url) {
      const user = await User.findOne({
        where: sequelize.where(sequelize.fn('lower', sequelize.col('url')), url.toLowerCase())
      })
      if (user) {
        let responseData
        if (!followers) {
          responseData = await user.getFollower({
            where: {
              '$follows.accepted$': {
                [Op.in]: req.jwtData?.userId === user.id ? [true, false] : [true]
              }
            },
            attributes: ['id', 'url', 'avatar', 'description']
          })
        } else {
          // who :url is following
          responseData = await user.getFollowed({
            where: {
              '$follows.accepted$': {
                [Op.in]: req.jwtData?.userId === user.id ? [true, false] : [true]
              }
            },
            attributes: ['id', 'url', 'avatar', 'description']
          })
        }
        if (user.hideFollows && user.url != req.jwtData?.url) {
          res.send([])
        } else {
          res.send(responseData)
        }
      } else {
        res.sendStatus(404)
      }
    } else {
      res.sendStatus(404)
    }
  })

  app.get('/api/user/myAsks', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId as string
    const asks = await Ask.findAll({
      attributes: ['userAsker', 'question', 'apObject', 'id', 'createdAt', 'postId'],
      where: {
        userAsked: userId,
        answered: req.query.answered === 'true'
      },
      order: [['createdAt', 'DESC']]
    })
    const users = await User.findAll({
      attributes: ['url', 'avatar', 'name', 'id', 'description'],
      where: {
        id: {
          [Op.in]: asks.map((ask: any) => ask.userAsker)
        }
      }
    })
    res.send({
      asks: asks,
      users: users
    })
  })

  app.post('/api/user/:url/ask', optionalAuthentication, async (req: AuthorizedRequest, res: Response) => {
    // a bit dirty innit
    if (req.body.anonymous) {
      req.jwtData = undefined
    }
    const lastHourAsks = await Ask.count({
      where: {
        creationIp: getIp(req),
        createdAt: {
          [Op.gt]: new Date().setHours(new Date().getHours() - 1)
        }
      }
    })
    // a bit dirty of a way but yeah limit asks if user is not logged in. if user is logged in we can ban them later
    if (lastHourAsks >= 5 && !req.jwtData?.userId) {
      return res.sendStatus(429)
    }
    const url = req.params?.url as string
    const userRecivingAsk = await User.findOne({
      where: sequelize.where(sequelize.fn('lower', sequelize.col('url')), url.toLowerCase())
    })
    if (!userRecivingAsk) {
      res.sendStatus(500)
      logger.warn({
        message: `Ask invalid user: ${url}`
      })
      return
    }
    const userAskLevelDBOption = await UserOptions.findOne({
      where: {
        userId: userRecivingAsk.id,
        optionName: 'wafrn.public.asks'
      }
    })
    const userAskLevel = userAskLevelDBOption ? parseInt(userAskLevelDBOption.optionValue) : 2
    //
    if ((!req.jwtData?.userId && userAskLevel === 1) || (req.jwtData?.userId && [1, 2].includes(userAskLevel))) {
      // user can recive an ask from this endpoint
      const userAsking = req.jwtData?.userId
      if (userAsking === userRecivingAsk.id) {
        return res.send({
          success: false
        })
      }
      const ask = await Ask.create({
        question: req.body.question,
        apObject: null,
        creationIp: getIp(req),
        answered: false,
        userAsked: userRecivingAsk.id,
        userAsker: userAsking
      })
      res.send({
        success: true
      })
    } else {
      // user can not recive an ask here so we say nope.avi
      res.send({
        success: false
      })
    }
  })

  app.post('/api/user/ignoreAsk', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const askToIgnore = await Ask.findOne({
      where: {
        userAsked: req.jwtData?.userId as string,
        id: req.body.id
      }
    })
    res.send({
      success: askToIgnore ? true : false
    })
    if (askToIgnore) {
      await askToIgnore.destroy()
    }
  })

  app.post('/api/user/bookmarkPost', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      if (req.body.postId) {
        const userId = req.jwtData?.userId as string
        const postId = req.body.postId
        await UserBookmarkedPosts.findOrCreate({
          where: {
            postId: postId,
            userId: userId
          }
        })
        success = true
      }
    } catch (error) {
      logger.info({
        message: `Error creating bookmark of post`,
        error: error
      })
    }

    res.send({
      success: success
    })
  })

  app.post('/api/user/unbookmarkPost', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    try {
      if (req.body.postId) {
        const userId = req.jwtData?.userId as string
        const postId = req.body.postId
        await UserBookmarkedPosts.destroy({
          where: {
            postId: postId,
            userId: userId
          }
        })
        success = true
      }
    } catch (error) {
      logger.info({
        message: `Error deleting bookmark of post`,
        error: error
      })
    }

    res.send({
      success: success
    })
  })
}

async function updateBlueskyProfile(agent: BskyAgent, user: User) {
  await forceUpdateCacheDidsAtThread()
  await getCacheAtDids(true)
  return await agent.upsertProfile(async (existingProfile) => {
    const profile = existingProfile ?? {}
    const fullProfileString = `\nView full profile at ${environment.frontendUrl}/blog/${user.url}`
    profile.displayName = user.name.substring(0, 63)
    profile.description =
      dompurify.sanitize(user.descriptionMarkdown.substring(0, 256 - fullProfileString.length), { ALLOWED_TAGS: [] }) +
      fullProfileString
    if (user.avatar) {
      let pngAvatar = await optimizeMedia('uploads' + user.avatar, {
        forceImageExtension: 'png',
        maxSize: 256,
        keep: true
      })
      const userAvatarFile = Buffer.from(await fs.readFile(pngAvatar))
      const avatarUpload = await agent.uploadBlob(userAvatarFile, { encoding: 'image/png' })
      const avatarData = avatarUpload.data.blob
      profile.avatar = avatarData
      await fs.unlink(pngAvatar)
    }
    // TODO fix this it does not work
    if (user.headerImage && false) {
      let jpegHeader = await optimizeMedia('uploads/' + user.headerImage, {
        forceImageExtension: 'jpg',
        maxSize: 256,
        keep: true
      })
      const userHeaderFile = Buffer.from(jpegHeader)
      const headerUpload = await agent.uploadBlob(userHeaderFile, { encoding: 'image/jpeg' })
      const headerData = headerUpload.data.blob
      profile.banner = headerData
      await fs.unlink(userHeaderFile)
    }

    return profile
  })
}

async function updateProfileOptions(optionsJSON: string, posterId: string) {
  const _options = JSON.parse(optionsJSON)
  if (Array.isArray(_options)) {
    const options = _options
      .filter((elem) => elem.name)
      .map((opt) => {
        return {
          ...opt,
          // NOTE: opt.value should be a string result of JSON.stringify, adding this to prevent any potential security issues
          value: String(opt.value),
          public: opt.name.startsWith('wafrn.public') || opt.name.startsWith('fediverse.public')
        }
      })

    for (const option of options) {
      if (option.value) {
        const userOption = await UserOptions.findOne({
          where: {
            userId: posterId,
            optionName: option.name
          }
        })
        userOption
          ? await userOption.update({
              optionValue: option.value,
              public: option.public == true
            })
          : await UserOptions.create({
              userId: posterId,
              optionName: option.name,
              optionValue: option.value,
              public: option.public == true
            })
      }
    }
  }
}

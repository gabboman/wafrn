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
import { AtpAgent, BskyAgent } from '@atproto/api'
import { getAtProtoSession } from '../atproto/utils/getAtProtoSession.js'
import { forceUpdateCacheDidsAtThread, getCacheAtDids } from '../atproto/cache/getCacheAtDids.js'
import dompurify from 'isomorphic-dompurify'
import { Queue } from 'bullmq'
import * as OTPAuth from 'otpauth'
import verifyTotp from '../utils/verifyTotp.js'
import { getPetitionSigned } from '../utils/activitypub/getPetitionSigned.js'
import { isArray } from 'underscore'
import { follow } from '../utils/follow.js'
import { activityPubObject } from '../interfaces/fediverse/activityPubObject.js'
import { getFollowedHashtags } from '../utils/getFollowedHashtags.js'
import { completeEnvironment } from '../utils/backendOptions.js'
import { sendUpdateProfile } from '../utils/activitypub/sendUpdateProfile.js'
import axios from 'axios'

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
  connection: completeEnvironment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: true
  }
})

const deletePostQueue = new Queue('deletePostQueue', {
  connection: completeEnvironment.bullmqConnection,
  defaultJobOptions: {
    removeOnComplete: true,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnFail: true
  }
})

function userRoutes(app: Application) {
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
            if (completeEnvironment.removeFolderNameFromFileUploads) {
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
              password: await bcrypt.hash(req.body.password, completeEnvironment.saltRounds),
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
            const mailHeader = `Welcome to ${completeEnvironment.instanceUrl}, please verify your email!`
            const mailBody = `<h1>Welcome to ${completeEnvironment.instanceUrl}</h1> To verify your email <a href="${
              completeEnvironment.instanceUrl
            }/activate/${encodeURIComponent(
              req.body.email.toLowerCase()
            )}/${activationCode}">click here!</a>. If you can not see the link correctly please copy this link:
            ${completeEnvironment.instanceUrl}/activate/${encodeURIComponent(
              req.body.email.toLowerCase()
            )}/${activationCode}
            `
            const emailSent = completeEnvironment.disableRequireSendEmail
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
          res.status(400).send({
            success: false,
            message: 'Failed registration',
            email: req.body?.email,
            url: req.body.url,
            forbidChar: !forbiddenCharacters.some((char) => req.body.url.includes(char)),
            emailValid: validateEmail(req.body.email)
          })
          return
        }
        if (!success) {
          res.status(401).send({ success: false, message: 'Got to final part with success false' })
        }
      } catch (error) {
        logger.error(error)
        res.status(500).send({ success: false, error })
      }
    }
  )

  app.post('/api/updateCSS', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const posterId = req.jwtData?.userId
    const cssContent = req.body.css ? req.body.css.trim() : undefined
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
      try {
        await fs.unlink(`uploads/themes/${posterId}.css`)
        res.send({ success: true })
      } catch (error) {
        logger.warn(error)
        res.status(500)
        res.send({ error: true })
      }
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
            if (completeEnvironment.removeFolderNameFromFileUploads) {
              url = url.slice('/uploads/'.length - 1)
            }
            user.avatar = url
          }
          if (headerImage != null) {
            let url = `/${await optimizeMedia(headerImage.path, { forceImageExtension: 'webp' })}`
            if (completeEnvironment.removeFolderNameFromFileUploads) {
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
          // force update fedi profile
          await redisCache.del('fediverse:user:base:' + posterId)
          await sendUpdateProfile(user)
          success = true
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

          const link = `${completeEnvironment.instanceUrl}/resetPassword/${encodeURIComponent(email)}/${resetCode}`
          const appLink = `wafrn://complete-password-reset?email=${encodeURIComponent(email)}&code=${resetCode}`

          await sendActivationEmail(
            req.body.email.toLowerCase(),
            '',
            `So you forgot your ${completeEnvironment.instanceUrl} password`,
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
        if (!completeEnvironment.reviewRegistrations) {
          user.activated = true
          emailSubject = 'Your wafrn account has been activated!'
          emailBody = ';D'
        } else {
          emailBody =
            'Hello, thanks for confirming your email address. The admin team will review your registration and will be aproved shortly'
          emailSubject = 'Thanks for verifying your email, Our admin team will review your registration request soon!'
        }
        try {
          await Promise.all([
            user.save(),
            sendActivationEmail(req.body.email.toLowerCase(), '', emailSubject, emailBody)
          ])
          success = true
        } catch (error) {
          logger.info({
            message: `Error while activating account`,
            error: error
          })
        }
      }
    }

    if (!success) {
      logger.info({
        message: `Success marked as false on activate account!`,
        body: req.body
      })
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
          user.emailVerified = true
          user.password = await bcrypt.hash(req.body.password, completeEnvironment.saltRounds)
          user.activated = completeEnvironment.reviewRegistrations ? user.activated : true
          user.requestedPasswordReset = null
          await user.save()

          // also reset MFA details
          await MfaDetails.destroy({
            where: {
              userId: user.id
            }
          })

          // also update the bluesky password
          if (user.enableBsky && user.bskyDid) {
            await updateBskyPassword(user, req.body.password)
          }

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
                    completeEnvironment.jwtSecret,
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
                    completeEnvironment.jwtSecret,
                    { expiresIn: '31536000s' }
                  )
                })
                userWithEmail.lastLoginIp = getIp(req, true)
                await userWithEmail.save()
              }
            } else {
              res.send({
                success: false,
                message: 'Please activate your account! Check your email'
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
        message: 'Please recheck your email and password'
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
                completeEnvironment.jwtSecret,
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
        message: 'Invalid code provided'
      })
    }
  })

  // list all registered MFA options for a user
  app.get('/api/user/mfa', authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      if (!req.jwtData?.userId) {
        // NOTE: 401 means "we need to know who you are", not "you are not authorized to do this" which would be code 403
        res.status(401).send({ success: false, message: 'Invalid JWT' })
        return
      }

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
    } catch (error) {
      logger.error(error)
      res.status(500).send({ success: false, message: 'Error fetching MFA details' })
    }
  })

  app.post('/api/user/mfa', authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      if (!req.jwtData?.userId) {
        res.status(401).send({ success: false, message: 'Invalid JWT' })
        return
      }
      if (req.body?.type !== 'totp') {
        res.status(400).send({ success: false, message: 'Invalid MFA type' })
        return
      }

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

      totpSettings.issuer = completeEnvironment.instanceUrl
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
    } catch (error) {
      logger.error(error)
      res.status(500).send({ success: false, message: 'Error creating MFA detail' })
    }
  })

  app.post('/api/user/mfa/:id/verify', authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      if (!req.jwtData?.userId) {
        res.status(401).send({ success: false, message: 'Invalid JWT' })
        return
      }
      if (!req.body?.token) {
        res.status(400).send({ success: false, message: 'Token is required' })
        return
      }

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
      } else {
        logger.info({
          message: 'MFA detail not found',
          userId: req.jwtData?.userId,
          mfaDetailId: req.params.id
        })
        res.status(500).send({ success: false })
        // NOTE: explicitly not sending 404 here because
        // we don't want to leak information about the existence of the MFA detail to the user
      }
    } catch (error) {
      logger.error(error)
      res.status(500).send({ success: false, message: 'Error verifying MFA token' })
    }
  })

  app.delete('/api/user/mfa/:id', authenticateToken, async (req: AuthorizedRequest, res) => {
    try {
      if (!req.jwtData?.userId) {
        res.status(401).send({ success: false, message: 'Invalid JWT' })
        return
      }
      if (!req.params.id) {
        res.status(400).send({ success: false, message: 'MFA detail ID is required' })
        return
      }
      const mfaDetail = await MfaDetails.findOne({
        where: {
          id: req.params.id,
          userId: req.jwtData?.userId
        }
      })
      if (mfaDetail) {
        await mfaDetail.destroy()
      }
      // NOTE: explicitly not sending 404 here because
      // we don't want to leak information about the existence of the MFA detail to the user
      res.send({ success: true })
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
          'userMigratedTo',
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
    const myFollowers = getFollowedsIds(userId, false, { getFollowersInstead: true })

    const blockedUsers = getBlockedIds(userId)
    const notAcceptedFollows = getNotYetAcceptedFollowedids(userId)
    const options = getUserOptions(userId)
    const localEmojis = getAvaiableEmojisCache()
    const mutedUsers = getMutedUsers(userId)
    let userPromise = User.findByPk(req.jwtData?.userId, {
      attributes: ['banned', 'enableBsky']
    })
    const silencedPosts = getMutedPosts(userId)
    const followedHashtags = getFollowedHashtags(userId)
    Promise.all([
      userPromise,
      followedUsers,
      blockedUsers,
      notAcceptedFollows,
      options,
      silencedPosts,
      localEmojis,
      mutedUsers,
      followedHashtags,
      myFollowers
    ])
    const user = await userPromise
    if (!user || user.banned) {
      res.sendStatus(401)
    } else {
      const user = (await userPromise) as User
      const mutedQuotes = (
        await Follows.findAll({
          where: {
            followerId: userId,
            muteQuotes: true
          }
        })
      ).map((elem) => elem.followedId)

      const mutedRewoots = (
        await Follows.findAll({
          where: {
            followerId: userId,
            muteRewoots: true
          }
        })
      ).map((elem) => elem.followedId)
      res.send({
        myFollowers: await myFollowers,
        followedUsers: await followedUsers,
        blockedUsers: await blockedUsers,
        notAcceptedFollows: await notAcceptedFollows,
        options: await options,
        silencedPosts: await silencedPosts,
        emojis: await localEmojis,
        mutedUsers: await mutedUsers,
        followedHashtags: await followedHashtags,
        enableBluesky: user.enableBsky,
        mutedRewoots,
        mutedQuotes
      })
    }
  })

  app.post('/api/v2/enable-bluesky', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    if (!completeEnvironment.enableBsky) {
      return res.status(500).send({
        error: true,
        message: `This instance does not have bluesky enabled at this moment`
      })
    }

    const password = req.body.password
    const userId = req.jwtData?.userId as string

    let user: User | null = null
    try {
      user = await User.findByPk(userId)
    } catch (error) {
      logger.error({
        message: `Error finding current user`,
        error: error
      })
      return res.status(500).send({
        error: true,
        message: `Error finding current user`
      })
    }

    if (!user) {
      return res.status(404).send({
        error: true,
        message: `Current user not found in database`
      })
    }

    if (user.enableBsky && user.bskyAppPassword) {
      return res.status(400).send({
        error: true,
        message: `You already have bluesky enabled`
      })
    }

    if (!password) {
      return res.status(400).send({
        error: true,
        message: `A "password" field is required in the body`
      })
    }

    try {
      // ensure that the received password is the same as the password for the wafrn account of this user.
      const correctPassword = await bcrypt.compare(password, user.password)
      if (!correctPassword) {
        return res.status(400).send({
          error: true,
          message: `Invalid password`
        })
      }

      const inviteCodeRecord = await BskyInviteCodes.findOne({
        where: {
          masterCode: true
        }
      })
      const inviteCode = inviteCodeRecord?.code

      if (!inviteCode) {
        return res.status(400).send({
          error: true,
          message: `Contact the administrator: no master invite code available`
        })
      }

      const serviceUrl = completeEnvironment.bskyPds.startsWith('http')
        ? completeEnvironment.bskyPds
        : 'https://' + completeEnvironment.bskyPds

      const agent = new AtpAgent({
        service: serviceUrl
      })

      if (user.enableBsky && user.bskyDid && user.bskyAuthData) {
        try {
          await updateBskyPassword(user, password)
          await agent.login({
            identifier: user.bskyDid as string,
            password: password
          })
        } catch (error) {
          logger.error({
            message: `Failed to update bsky to new type to ${user.url}`,
            error: error
          })
        }
      } else {
        await createBskyAccount({
          agent,
          user,
          password,
          inviteCode
        })
      }

      // create an app password for the newly created user.
      const bskyPasswordCreated = await createBskyPassword(user, agent)
      if (!bskyPasswordCreated) {
        return res.status(500).send({
          error: true,
          message: `Failed to create app password`
        })
      }
      // now we have to update the profile of the bluesky user coping from the wafrn user profile.
      await updateBlueskyProfile(agent, user)
      res.send({
        success: true,
        did: agent.assertDid
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

  app.post('/api/user/selfDeactivate', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    // frontend will warn user. User will recive email.
    let success = false
    const userId = req.jwtData?.userId as string
    const user = (await User.findByPk(userId)) as User
    const password = req.body.password
    if (req.body.password && (await bcrypt.compare(req.body.password, user.password))) {
      user.selfDeleted = true
      user.activated = false
      user.updatedAt = new Date()
      user.banned = true
      await user.save()
      await sendActivationEmail(
        user.email as string,
        '',
        `We have marked your ${completeEnvironment.instanceUrl} for deletion`,
        `
            <h1>We are sad to see you go</h1>
            <p>
             We have recived your request to delete your account. It will still ve visible for a few moments. In 30 days or less we will complete the destruction process and at that point there will be no going back</p>
             <p>This is a slow process on our side and thats why its not done imediately</p>
             <p>We will send to every fedi server that has ever seen a post of yours a "PLEASE DELETE. NOW". This task takes time and slows down the server. We run this task weekly more or less. But just in case, "30 days"</p>.
            `
      )
    }

    res.send({
      success: success
    })
  })

  // TODO still not finished
  app.post('/api/user/migrateOut', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    let success = false
    const newUserRemoteId: string = req.body.target
    const localUser = await User.findByPk(req.jwtData?.userId)
    let message = `User not yet found`
    if (newUserRemoteId && localUser) {
      message = `User found but new account doesnt seems to have an alias pointing towards you`
      try {
        const localUser = (await User.findByPk(req.jwtData?.userId)) as User
        const petitionData = await getPetitionSigned(localUser, newUserRemoteId)
        if (petitionData && petitionData.alsoKnownAs) {
          const aliasList = isArray(petitionData.alsoKnownAs)
            ? petitionData.alsoKnownAs.map((elem: string) => elem.toLowerCase())
            : [petitionData.alsoKnownAs.toLowerCase()]
          if (aliasList.includes(`${completeEnvironment.frontendUrl}/fediverse/blog/${localUser.url}`)) {
            // TIME TO MOVE OUT
            // FIRST STEP: followers. send message to each follower. a move object
            const followerIds = await Follows.findAll({
              attributes: ['followerId'],
              where: {
                followedId: localUser.id
              }
            })
            const followers = await User.findAll({
              where: {
                id: {
                  [Op.in]: followerIds.map((elem) => elem.followerId)
                }
              }
            })
            const moveObjectToSend: activityPubObject = {
              '@context': 'https://www.w3.org/ns/activitystreams',
              id:
                completeEnvironment.frontendUrl +
                '/fediverse/blogMove/' +
                localUser.url.toLowerCase() +
                '/' +
                new Date().getTime(),
              actor: completeEnvironment.frontendUrl + '/fediverse/blog/' + localUser.url.toLowerCase(),
              type: 'Move',
              object: completeEnvironment.frontendUrl + '/fediverse/blog/' + localUser.url.toLowerCase(),
              target: newUserRemoteId
            }
            for await (const remoteFollower of followers.filter((elem) => !!elem.remoteId)) {
              await deletePostQueue.add('sendChunk', {
                objectToSend: moveObjectToSend,
                petitionBy: localUser,
                inboxList: [remoteFollower.remoteInbox]
              })
            }

            // second step: local followers here: create a follow request to new account
            const localFollows = await User.findAll({
              where: {
                id: {
                  [Op.in]: followerIds.map((elem) => elem.followerId)
                },
                email: {
                  [Op.ne]: null
                }
              }
            })
            for await (const localFollow of localFollows) {
              try {
                await follow(localFollow.id, localUser.id)
              } catch (error) {}
            }
            // third step: return data and set message to succ ess
            localUser.userMigratedTo = newUserRemoteId
            await localUser.save()
            message = `Operation successful!`
            success = true
          } else {
            message = `Alias not detected`
          }
        }
      } catch (error) {}
    }

    res.status(success ? 200 : 500)
    res.send({
      success,
      message
    })
  })
}

async function updateBlueskyProfile(agent: BskyAgent, user: User) {
  try {
    await forceUpdateCacheDidsAtThread()
    await getCacheAtDids(true)
    return await agent.upsertProfile(async (existingProfile) => {
      const profile = existingProfile ?? {}
      const fullProfileString = `\n\nView full profile at ${completeEnvironment.frontendUrl}/blog/${user.url}`
      profile.displayName = user.name.substring(0, 63)
      profile.description =
        dompurify.sanitize(
          user.descriptionMarkdown ? user.descriptionMarkdown.substring(0, 248 - fullProfileString.length) : '',
          { ALLOWED_TAGS: [] }
        ) +
        '[...]' +
        fullProfileString
      if (user.avatar) {
        let pngAvatar = await optimizeMedia('uploads' + user.avatar, {
          forceImageExtension: 'png',
          maxSize: 512,
          keep: true,
          disableAnimation: true
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
  } catch (error) {
    logger.error({
      message: `Error updatig bsky profile: ${user.url}`,
      error
    })
  }
  return {}
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

async function createBskyAccount({
  agent,
  user,
  password,
  inviteCode
}: {
  agent: AtpAgent
  user: User
  password: string
  inviteCode: string
}) {
  const pdsHandleUrl = completeEnvironment.bskyPdsUrl.startsWith('http')
    ? completeEnvironment.bskyPdsUrl.replace('https://', '').replace('http://', '')
    : completeEnvironment.bskyPdsUrl

  const sanitizedUrl = user.url.replaceAll('_', '-').replaceAll('.', '-')

  // this try-catch block does not catch very much, it is only used to add the error to the logger.
  try {
    // the createAccount method will also login as the newly created user.
    const accountCreation = await agent.createAccount({
      email: `${user.url}@${completeEnvironment.instanceUrl}`,
      handle: `${sanitizedUrl}.${pdsHandleUrl}`,
      password,
      inviteCode
    })
    logger.info({
      message: `Bsky account created for ${user.url}`,
      response: accountCreation
    })
  } catch (error) {
    logger.error({
      message: `Bsky account creation failed for ${user.url}`,
      error: error
    })
    throw error
  }
}

async function createBskyPassword(user: User, agent: AtpAgent) {
  const appPasswordResponse = await agent.com.atproto.server.createAppPassword({
    name: 'wafrn app password DO NOT DELETE'
  })

  if (!appPasswordResponse.success) {
    logger.error({
      message: `Error creating bluesky app password for user ${user.url}`,
      response: appPasswordResponse
    })
    return false
  }

  const appPassword = appPasswordResponse.data.password
  const userDid = agent.assertDid

  user.bskyDid = userDid
  user.bskyAuthData = null
  user.bskyAppPassword = appPassword
  user.enableBsky = true
  await user.save()
  return true
}

async function updateBskyPassword(user: User, password: string) {
  const authString = Buffer.from('admin:' + completeEnvironment.bskyPdsAdminPassword).toString('base64')
  return await axios.post(
    'https://' + completeEnvironment.bskyPdsUrl + '/xrpc/com.atproto.admin.updateAccountPassword',
    { did: user.bskyDid, password: password },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + authString
      }
    }
  )
}

export { userRoutes, updateBlueskyProfile }

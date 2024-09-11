import { Application, Response } from 'express'
import { Op, Sequelize } from 'sequelize'
import {
  Ask,
  Blocks,
  Emoji,
  EmojiCollection,
  FederatedHost,
  Follows,
  Mutes,
  ServerBlock,
  User,
  UserEmojiRelation,
  UserOptions
} from '../db'
import { authenticateToken } from '../utils/authenticateToken'

import generateRandomString from '../utils/generateRandomString'
import getIp from '../utils/getIP'
import sendActivationEmail from '../utils/sendActivationEmail'
import validateEmail from '../utils/validateEmail'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sequelize } from '../db'

import optimizeMedia from '../utils/optimizeMedia'
import uploadHandler from '../utils/uploads'
import { generateKeyPairSync } from 'crypto'
import { environment } from '../environment'
import { logger } from '../utils/logger'
import { createAccountLimiter, loginRateLimiter } from '../utils/rateLimiters'
import fs from 'fs/promises'
import AuthorizedRequest from '../interfaces/authorizedRequest'
import optionalAuthentication from '../utils/optionalAuthentication'
import checkIpBlocked from '../utils/checkIpBlocked'
import { redisCache } from '../utils/redis'
import getFollowedsIds from '../utils/cacheGetters/getFollowedsIds'
import getBlockedIds from '../utils/cacheGetters/getBlockedIds'
import { getNotYetAcceptedFollowedids } from '../utils/cacheGetters/getNotYetAcceptedFollowedIds'
import { getUserOptions } from '../utils/cacheGetters/getUserOptions'
import { getMutedPosts } from '../utils/cacheGetters/getMutedPosts'
import { getAvaiableEmojis } from '../utils/getAvaiableEmojis'
import { getMutedUsers } from '../utils/cacheGetters/getMutedUsers'
import { getAvaiableEmojisCache } from '../utils/cacheGetters/getAvaiableEmojis'
import { rejectremoteFollow } from '../utils/activitypub/rejectRemoteFollow'
import { acceptRemoteFollow } from '../utils/activitypub/acceptRemoteFollow'

const forbiddenCharacters = [':', '@', '/', '<', '>', '"']

export default function userRoutes(app: Application) {
  app.post(
    '/api/register',

    createAccountLimiter,
    uploadHandler().single('avatar'),
    async (req, res) => {
      let success = false
      try {
        if (
          req.body?.email &&
          req.body.url &&
          !forbiddenCharacters.some((char) => req.body.url.includes(char)) &&
          validateEmail(req.body.email)
        ) {
          const emailExists = await User.findOne({
            where: {
              [Op.or]: [
                { email: req.body.email.toLowerCase() },
                {
                  urlToLower: req.body.url.toLowerCase().trim().replace(' ', '_')
                }
              ]
            }
          })
          if (!emailExists) {
            let avatarURL = '' // Empty user avatar in case of error let frontend do stuff
            if (req.file != null) {
              avatarURL = `/${await optimizeMedia(req.file.path)}`
            }
            if (environment.removeFolderNameFromFileUploads) {
              avatarURL = avatarURL.slice('/uploads/'.length - 1)
            }
            const activationCode = generateRandomString()
            const { publicKey, privateKey } = generateKeyPairSync('rsa', {
              modulusLength: 4096,
              publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
              },
              privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
              }
            })
            const user = {
              email: req.body.email.toLowerCase(),
              description: req.body.description.trim(),
              url: req.body.url.trim().replace(' ', '_'),
              name: req.body.name ? req.body.name : req.body.url.trim().replace(' ', '_'),
              NSFW: req.body.nsfw === 'true',
              password: await bcrypt.hash(req.body.password, environment.saltRounds),
              birthDate: new Date(req.body.birthDate),
              avatar: avatarURL,
              activated: false,
              registerIp: getIp(req),
              lastLoginIp: 'ACCOUNT_NOT_ACTIVATED',
              banned: false,
              activationCode,
              privateKey,
              publicKey
            }

            const userWithEmail = User.create(user)
            const mailHeader = environment.reviewRegistrations
              ? 'We are reviewing your profile'
              : `Welcome to ${environment.instanceUrl}!`
            const mailBody = environment.reviewRegistrations
              ? `Hello ${req.body.url}, at this moment we are manually reviewing registrations. You will recive an email from us once it's accepted`
              : `<h1>Welcome to ${environment.instanceUrl}</h1> To activate your account <a href="${environment.instanceUrl
              }/activate/${encodeURIComponent(req.body.email.toLowerCase())}/${activationCode}">click here!</a>`
            const emailSent = environment.disableRequireSendEmail
              ? true
              : sendActivationEmail(req.body.email.toLowerCase(), activationCode, mailHeader, mailBody)
            await Promise.all([userWithEmail, emailSent])
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
        }
      } catch (error) {
        logger.error(error)
      }
      if (!success) {
        res.statusCode = 401
        res.send({ success: false })
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
    uploadHandler().single('avatar'),
    async (req: AuthorizedRequest, res: Response) => {
      let success = false
      try {
        const posterId = req.jwtData?.userId as string
        const user = await User.findOne({
          where: {
            id: posterId
          }
        })
        if (req.body) {
          const avaiableEmojis = await getAvaiableEmojis()
          let userEmojis: any[] = []
          if (req.body.manuallyAcceptsFollows) {
            user.manuallyAcceptsFollows = req.body.manuallyAcceptsFollows
          }
          if (req.body.description) {
            user.description = req.body.description
            userEmojis = userEmojis.concat(
              avaiableEmojis?.filter((emoji: any) => req.body.description.includes(emoji.name))
            )
          }
          // TODO find a better way of doing this than manualy doing stuff
          if (req.body.asksLevel) {
            const askLevelKey = 'wafrn.public.asks'
            const askLevel = req.body.asksLevel
            const askLevelOption = await UserOptions.findOne({
              where: {
                userId: posterId,
                optionName: askLevelKey
              }
            })
            if (askLevelOption) {
              askLevelOption.optionValue = askLevel
              askLevelOption.save()
            } else {
              await UserOptions.create({
                userId: posterId,
                optionName: askLevelKey,
                public: true,
                optionValue: askLevel
              })
            }
          }
          if (req.body.federateWithThreads) {
            const federateWithThreadsKey = 'wafrn.federateWithThreads'
            const federateWithThreads = req.body.federateWithThreads
            let federateWithThreadsOption = await UserOptions.findOne({
              where: {
                userId: posterId,
                optionName: federateWithThreadsKey
              }
            })
            if (federateWithThreadsOption) {
              federateWithThreadsOption.optionValue = federateWithThreads
              await federateWithThreadsOption.save()
            } else {
              federateWithThreadsOption = await UserOptions.create({
                userId: posterId,
                optionName: federateWithThreadsKey,
                optionValue: federateWithThreads
              })
            }
          }

          let disableForceAltText = await UserOptions.findOne({
            where: {
              userId: posterId,
              optionName: 'wafrn.disableForceAltText'
            }
          })
          if (disableForceAltText) {
            disableForceAltText.optionValue = req.body.disableForceAltText
            await disableForceAltText.save()
          } else {
            disableForceAltText = UserOptions.create({
              userId: posterId,
              optionName: 'wafrn.disableForceAltText',
              optionValue: req.body.disableForceAltText
            })
          }
          let forceOldEditor = await UserOptions.findOne({
            where: {
              userId: posterId,
              optionName: 'wafrn.forceOldEditor'
            }
          })
          if (forceOldEditor) {
            forceOldEditor.optionValue = req.body.forceOldEditor
            await forceOldEditor.save()
          } else {
            forceOldEditor = UserOptions.create({
              userId: posterId,
              optionName: 'wafrn.forceOldEditor',
              optionValue: req.body.forceOldEditor
            })
          }
          if (req.body.forceClassicLogo !== undefined && req.body.forceClassicLogo !== null) {
            const forceClassicKey = 'wafrn.forceClassicLogo'
            const forceClassicNewValue = req.body.forceClassicLogo === 'true'
            let dbForceClassic = await UserOptions.findOne({
              where: {
                userId: posterId,
                optionName: forceClassicKey
              }
            })
            if (dbForceClassic) {
              dbForceClassic.optionValue = forceClassicNewValue
              await dbForceClassic.save()
            } else {
              dbForceClassic = await UserOptions.create({
                userId: posterId,
                optionName: forceClassicKey,
                optionValue: forceClassicNewValue
              })
            }
          }
          if (req.body.defaultPostEditorPrivacy) {
            const defaultPostEditorPrivacyKey = 'wafrn.defaultPostEditorPrivacy'
            const defaultPostEditorPrivacy = req.body.defaultPostEditorPrivacy
            let dbDefaultPostEditorPrivacy = await UserOptions.findOne({
              where: {
                userId: posterId,
                optionName: defaultPostEditorPrivacyKey
              }
            })
            if (dbDefaultPostEditorPrivacy) {
              dbDefaultPostEditorPrivacy.optionValue = defaultPostEditorPrivacy
              await dbDefaultPostEditorPrivacy.save()
            } else {
              dbDefaultPostEditorPrivacy = await UserOptions.create({
                userId: posterId,
                optionName: defaultPostEditorPrivacyKey,
                optionValue: defaultPostEditorPrivacy
              })
            }
            redisCache.del(`userOptions:${posterId}`)
          }

          if (req.body.name) {
            user.name = req.body.name
            userEmojis = userEmojis.concat(avaiableEmojis?.filter((emoji: any) => req.body.name.includes(emoji.name)))
          }

          if (req.file != null) {
            let avatarURL = `/${await optimizeMedia(req.file.path)}`
            if (environment.removeFolderNameFromFileUploads) {
              avatarURL = avatarURL.slice('/uploads/'.length - 1)
              user.avatar = avatarURL
            }
          }
          await UserEmojiRelation.destroy({
            where: {
              userId: user.id
            }
          })
          await UserEmojiRelation.destroy({
            where: {
              userId: user.id
            }
          })
          await user.removeEmojis()
          user.setEmojis([...new Set(userEmojis)])
          await user.save()
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
    if (req.body?.email && validateEmail(req.body.email) && req.body.code && !environment.reviewRegistrations) {
      const user = await User.findOne({
        where: {
          email: req.body.email.toLowerCase(),
          activationCode: req.body.code
        }
      })
      if (user) {
        user.activated = true
        user.save()
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
          user.save()
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
            email: req.body.email.toLowerCase(),
            banned: {
              [Op.ne]: true
            }
          }
        })
        if (userWithEmail) {
          const correctPassword = await bcrypt.compare(req.body.password, userWithEmail.password)
          if (correctPassword) {
            success = true
            if (userWithEmail.activated) {
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
              userWithEmail.lastLoginIp = getIp(req)
              userWithEmail.save()
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

  app.get('/api/user', optionalAuthentication, async (req: AuthorizedRequest, res) => {
    let success = false
    if (req.query?.id) {
      const blogId: string = (req.query.id || '').toString().toLowerCase().trim()
      const blog = await User.findOne({
        attributes: [
          'id',
          'url',
          'name',
          'createdAt',
          'description',
          'remoteId',
          'avatar',
          'federatedHostId',
          'headerImage',
          'followingCount',
          'followerCount',
          'manuallyAcceptsFollows'
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
          urlToLower: blogId,
          banned: false
        }
      })
      if (!blog) {
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
            userBlockerId: req.jwtData.userId,
            blockedServerId: blog.federatedHostId
          }
        })
        await Promise.all([mutedQuery, blockedQuery, serverBlockedQuery, followed, followers, publicOptions])
        muted = (await mutedQuery) === 1
        blocked = (await blockedQuery) === 1
        serverBlocked = serverBlocked || (await serverBlockedQuery) === 1
      } else {
        await Promise.all([followed, followers])
      }

      followed = await followed
      followers = await followers
      success = blog
      if (success) {
        res.send({
          ...blog.dataValues,
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
    let user = User.findByPk(req.jwtData?.userId, {
      attributes: ['banned']
    })
    const silencedPosts = getMutedPosts(userId)
    Promise.all([
      user,
      followedUsers,
      blockedUsers,
      user,
      notAcceptedFollows,
      options,
      silencedPosts,
      localEmojis,
      mutedUsers
    ])
    user = await user
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

  app.get('/api/user/deleteFollow/:id', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId as string
    const forceUnfollowId = req.params?.id as string
    let success = true
    try {
      let follow = await Follows.findOne({
        where: {
          followerId: forceUnfollowId,
          followedId: userId
        }
      })
      if (follow.remoteFollowId) {
        await rejectremoteFollow(userId, forceUnfollowId)
      }
      await redisCache.del('follows:local:' + forceUnfollowId)
      await redisCache.del('follows:full:' + forceUnfollowId)
      await redisCache.del('follows:local:' + userId)
      await redisCache.del('follows:full:' + userId)
      await follow.destroy()
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
      if (follow.remoteFollowId) {
        await acceptRemoteFollow(userId, approvedFollower)
      }
      follow.accepted = 1
      await follow.save()
      await redisCache.del('follows:local:' + approvedFollower)
      await redisCache.del('follows:full:' + approvedFollower)
      await redisCache.del('follows:local:' + userId)
      await redisCache.del('follows:full:' + userId)
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
        where: {
          urlToLower: url.toLowerCase()
        }
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
        res.send(responseData)
      } else {
        res.send(404)
      }
    } else {
      res.sendStatus(404)
    }
  })

  app.get('/api/user/myAsks', authenticateToken, async (req: AuthorizedRequest, res: Response) => {
    const userId = req.jwtData?.userId as string;
    const asks = await Ask.findAll({
      attributes: ['userAsker', 'question', 'apObject', 'id'],
      where: {
        userAsked: userId,
        answered: false,
      }
    });
    const users = await User.findAll({
      attributes: ['url', 'avatar', 'name', 'id', 'description'],
      where: {
        id: {
          [Op.in]: asks.map((ask: any) => ask.userAsker)
        }
      }
    });
    res.send({
      asks: asks,
      users: users
    })

  })


  app.post('/api/user/:url/ask', optionalAuthentication, async (req: AuthorizedRequest, res: Response) => {
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
      return res.sendStatus(429);
    }
    const url = req.params?.url as string
    const userRecivingAsk = await User.findOne({
      where: {
        urlToLower: url.toLowerCase()
      }
    })
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
      const userAsking = req.jwtData?.userId;
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
}

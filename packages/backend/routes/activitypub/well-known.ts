import { Application, Request, Response } from 'express'
import { Op } from 'sequelize'
import sequelize from 'sequelize/lib/sequelize'
import { User, Post } from '../../models/index.js'
import { getAllLocalUserIds } from '../../utils/cacheGetters/getAllLocalUserIds.js'
import { return404 } from '../../utils/return404.js'
import fs from 'fs'

// @ts-ignore cacher has no types
import Cacher from 'cacher'
import { Privacy } from '../../models/post.js'
import { completeEnvironment } from '../../utils/backendOptions.js'
const cacher = new Cacher()

function wellKnownRoutes(app: Application) {
  // webfinger protocol
  app.get('/.well-known/host-meta', (req: Request, res) => {
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?><XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0"><Link rel="lrdd" template="${completeEnvironment.frontendUrl}/.well-known/webfinger?resource={uri}"/></XRD>`
    )
    res.end()
  })
  app.get('/.well-known/webfinger/', cacher.cache('seconds', 15), async (req: Request, res: Response) => {
    if (req.query?.resource) {
      const urlQueryResource: string = req.query.resource as string
      if (
        urlQueryResource.startsWith('acct:') &&
        (urlQueryResource.endsWith(completeEnvironment.instanceUrl) ||
          urlQueryResource.startsWith(`acct:${completeEnvironment.frontendUrl}/fediverse/blog/`))
      ) {
        const userUrl = urlQueryResource.endsWith(completeEnvironment.instanceUrl)
          ? urlQueryResource.slice(5).slice(0, -(completeEnvironment.instanceUrl.length + 1))
          : urlQueryResource.slice(`acct:${completeEnvironment.frontendUrl}/fediverse/blog/`.length)
        const user = await User.findOne({
          where: sequelize.where(sequelize.fn('lower', sequelize.col('url')), userUrl.toLowerCase())
        })
        if (!user) {
          return404(res)
          return
        }
        const response = {
          subject: urlQueryResource,
          aliases: [
            `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`,
            `${completeEnvironment.frontendUrl}/blog/${user.url.toLowerCase()}`
          ],
          links: [
            {
              rel: 'self',
              type: 'application/activity+json',
              href: `${completeEnvironment.frontendUrl}/fediverse/blog/${user.url.toLowerCase()}`
            },
            {
              rel: 'http://ostatus.org/schema/1.0/subscribe',
              template: `${completeEnvironment.frontendUrl}/fediverse/authorize_interaction?uri={uri}`
            }
          ]
        }
        res.send(response)
      } else {
        return404(res)
      }
    } else {
      return404(res)
    }
    res.end()
  })

  app.get('/.well-known/nodeinfo', cacher.cache('seconds', 600), (req, res) => {
    res.send({
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
          href: `${completeEnvironment.frontendUrl}/.well-known/nodeinfo/2.0`
        }
      ]
    })
    res.end()
  })

  app.get('/.well-known/nodeinfo/2.0', cacher.cache('seconds', 3600), async (req, res) => {
    const localUsersIds = await getAllLocalUserIds()
    const localUsers = await User.count({
      where: {
        id: {
          [Op.in]: localUsersIds
        },
        banned: false,
        activated: true
      }
    })
    const activeUsersSixMonths = await User.count({
      where: {
        id: {
          [Op.in]: localUsersIds
        },
        [Op.or]: [
          {
            lastActiveAt: {
              [Op.gt]: new Date().setMonth(new Date().getMonth() - 6)
            }
          },
          {
            lastTimeNotificationsCheck: {
              [Op.gt]: new Date().setMonth(new Date().getMonth() - 6)
            }
          }
        ]
      }
    })

    const activeUsersLastMonth = await User.count({
      where: {
        id: {
          [Op.in]: localUsersIds
        },
        [Op.or]: [
          {
            lastActiveAt: {
              [Op.gt]: new Date().setMonth(new Date().getMonth() - 1)
            }
          },
          {
            lastTimeNotificationsCheck: {
              [Op.gt]: new Date().setMonth(new Date().getMonth() - 1)
            }
          }
        ]
      }
    })
    const packageJsonFile = JSON.parse(fs.readFileSync('package.json').toString())

    res.send({
      version: '2.0',
      software: {
        name: 'wafrn',
        version: packageJsonFile.version
      },
      protocols: ['activitypub'],
      services: {
        outbound: [],
        inbound: []
      },
      usage: {
        users: {
          total: localUsers,
          activeMonth: activeUsersLastMonth,
          activeHalfyear: activeUsersSixMonths
        },
        localPosts: await Post.count({
          where: {
            userId: {
              [Op.in]: localUsersIds
            },
            privacy: Privacy.Public
          }
        })
      },
      openRegistrations: true,
      metadata: {
        themeColor: '#96d8d1'
      }
    })
    res.end()
  })
  app.get('/.well-known/assetlinks.json', (req, res) => {
    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'dev.djara.wafrn_rn',
          sha256_cert_fingerprints: [
            '09:1A:D9:44:84:3E:18:0C:43:22:ED:E2:02:A7:33:09:4C:DC:07:DD:1A:CD:51:52:3F:E8:13:EA:E9:04:F4:87'
          ]
        }
      }
    ])
  })
}

export { wellKnownRoutes }

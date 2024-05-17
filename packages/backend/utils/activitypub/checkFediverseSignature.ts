import { Request, Response, NextFunction } from 'express'
import { FederatedHost, User, sequelize } from '../../db'
import { environment } from '../../environment'
import { logger } from '../logger'
import crypto from 'crypto'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const httpSignature = require('@peertube/http-signature')
import Redis from 'ioredis'
import { Op } from 'sequelize'
import { createHash } from 'node:crypto'
import { redisCache } from '../redis'
import { getKey } from '../cacheGetters/getKey'
import { SignedRequest } from '../../interfaces/fediverse/signedRequest'
const adminUser = environment.forceSync
  ? null
  : User.findOne({
      where: {
        url: environment.adminUser
      }
    })

export default async function checkFediverseSignature(req: SignedRequest, res: Response, next: NextFunction) {
  let success = false
  let hostUrl = req.header('host') ? `petition without sighead ${req.header('host')}` : 'somewhere not specified'
  try {
    const sigHead = httpSignature.parseRequest(req, {
      headers: ['(request-target)', 'digest', 'host', 'date']
    })
    const remoteUserUrl = sigHead.keyId.split('#')[0]
    hostUrl = new URL(remoteUserUrl).host
    let bannedHostInCache = await redisCache.get('server:' + hostUrl)
    if (bannedHostInCache === null || bannedHostInCache === undefined) {
      const newResult = await FederatedHost.findOne({
        where: {
          [Op.or]: [
            sequelize.where(sequelize.fn('LOWER', sequelize.col('displayName')), 'LIKE', `${hostUrl.toLowerCase()}`)
          ]
        }
      })
      bannedHostInCache = newResult?.blocked.toString().toLowerCase()
      redisCache.set('server:' + hostUrl, bannedHostInCache ? bannedHostInCache : 'false', 'EX', 300)
    }
    if (bannedHostInCache === 'true') {
      return res.sendStatus(401)
    }
    const fediData = {
      fediHost: hostUrl,
      remoteUserUrl: remoteUserUrl
    }
    req.fediData = fediData
    const remoteKey = await getKey(remoteUserUrl, await adminUser)
    success =
      verifyDigest(req.rawBody ? req.rawBody : '', req.headers.digest) ||
      httpSignature.verifySignature(sigHead, remoteKey)
  } catch (error: any) {
    success = false
  }

  if (!success) {
    logger.trace(`Failed to verify signature in petition from ${hostUrl}`)
    return res.sendStatus(401)
  } else {
    next()
  }

  // stolen from catodon/firefish https://codeberg.org/catodon/catodon/src/branch/dev/packages/backend/src/remote/activitypub/check-fetch.ts
  function verifyDigest(body: string, digest: string | string[] | undefined): boolean {
    digest = toSingle(digest)
    if (body == null || digest == null || !digest.toLowerCase().startsWith('sha-256=')) return false

    return createHash('sha256').update(body).digest('base64') === digest.substring(8)
  }
  // also from catodon lol sorry
  function toSingle<T>(x: T | T[] | undefined): T | undefined {
    return Array.isArray(x) ? x[0] : x
  }
}

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
import { getRemoteActor } from './getRemoteActor'
import { LdSignature } from './rsa2017'
const adminUser = environment.forceSync
  ? null
  : User.findOne({
      where: {
        url: environment.adminUser
      }
    })

function getCheckFediverseSignatureFucnction(force = false) {
  return async function checkFediverseSignature(req: SignedRequest, res: Response, next: NextFunction) {
    let success = !force
    let hostUrl = req.header('user-agent')
      ? `petition without sighead ${req.header('user-agent')}`
      : 'somewhere not specified'
      let remoteUserUrl = ''
    try {
      const sigHead = httpSignature.parseRequest(req, {
        headers:
          req.method === 'GET' ? ['(request-target)', 'host', 'date'] : ['(request-target)', 'digest', 'host', 'date'],
        clockSkew: 600,
        strict: true
      })
      remoteUserUrl = sigHead.keyId.split('#')[0]
      hostUrl = new URL(remoteUserUrl).host
      let bannedHostInCache = await redisCache.get('server:' + hostUrl)
      if (bannedHostInCache === null || bannedHostInCache === undefined) {
        const newResult = await FederatedHost.findOne({
          where: {
            [Op.or]: [
              sequelize.where(sequelize.fn('LOWER', sequelize.col('displayName')), '=', `${hostUrl.toLowerCase()}`)
            ]
          }
        })
        bannedHostInCache = newResult?.blocked.toString().toLowerCase()
        redisCache.set('server:' + hostUrl, bannedHostInCache ? bannedHostInCache : 'false', 'EX', 300)
      }
      if (bannedHostInCache === 'true') {
        return res.sendStatus(403)
      }
      req.fediData = {
        fediHost: hostUrl,
        remoteUserUrl: remoteUserUrl,
        valid: false
      }
      let remoteKey = await getKey(remoteUserUrl, await adminUser)
      if(remoteKey.key) {
        remoteKey = remoteKey.key;
      } else {
        // we check for deleted users
        if(req.method === 'POST' && req.body.type == 'Delete' && req.body.actor == req.body.object && req.body.actor == remoteUserUrl) {
          // well, this is a "delete this user". We should process this ASAP
          req.fediData = {
            fediHost: hostUrl,
            remoteUserUrl: remoteUserUrl,
            valid: true
          }
          next();
          return;
        } else {
          res.set('Retry-After', '25')
          if(req.body.type != 'Delete') {
            logger.debug({
              message: `Problem finding user for signature`,
              body: req.method == 'POST' ? req.body : `GET petition`
            })
          }
          return res.sendStatus(429)
        }
      }
      success =
        req.method === 'POST'
          ? verifyDigest(req.rawBody ? req.rawBody : '', req.headers.digest)
          : httpSignature.verifySignature(sigHead, remoteKey)
      if (req.method === 'POST') {
        // we check that the petition is done by who it says its done
        success = success && remoteUserUrl.toLowerCase() === req.body.actor.toLowerCase()
        if(!success && req.body.signature && req.body.signature.type === 'RsaSignature2017') {
          const signature = req.body.signature;
          const remoteActor = await getRemoteActor(signature.creator.split('#')[0], adminUser);
          const jsonld = new LdSignature()
          success = !!await jsonld.verifyRsaSignature2017(req.body, remoteActor.publicKey).catch((error) => {
            // logger.debug(`Problem with jsonld signature ${hostUrl}: ${remoteUserUrl}`)
          })
          /*await jsonld.compact(req.body).catch((error: any) => {
            success = false
            logger.debug({
              message: `Problem with jsonld signature ${hostUrl}: ${remoteUserUrl}`,
              error: error
            })
          })
            */
        }
      }

      req.fediData = {
        fediHost: hostUrl,
        remoteUserUrl: remoteUserUrl,
        valid: success
      }
    } catch (error: any) {
      req.fediData = { fediHost: hostUrl, valid: false }
      if (force) {
        success = false
        logger.debug({
          message: 'Failed to verify signature',
          url: req.url,
          host: hostUrl,
          error: error
        })
      }
    }

    if (!success && force) {
      //logger.debug(`fail signature ${hostUrl}: ${remoteUserUrl}`)
      // logger.debug(req.body)
      return res.sendStatus(401)
    } else {
      next()
    }
  }
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

export { getCheckFediverseSignatureFucnction }

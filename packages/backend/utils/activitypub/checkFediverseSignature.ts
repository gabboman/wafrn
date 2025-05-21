import { Response, NextFunction } from 'express'
import { FederatedHost, User, sequelize } from '../../models/index.js'
import { environment } from '../../environment.js'
import { logger } from '../logger.js'
// @ts-ignore @peertube/http-signature doesn't have types
import httpSignature from '@peertube/http-signature'
import { Op } from 'sequelize'
import { createHash } from 'node:crypto'
import { redisCache } from '../redis.js'
import { getKey } from '../cacheGetters/getKey.js'
import { SignedRequest } from '../../interfaces/fediverse/signedRequest.js'
import { getRemoteActor } from './getRemoteActor.js'
import { LdSignature } from './rsa2017.js'

function getCheckFediverseSignatureFunction(force = false) {
  return async function checkFediverseSignature(req: SignedRequest, res: Response, next: NextFunction) {
    let success = !force
    let hostUrl = req.header('user-agent')
      ? `petition without sighead ${req.header('user-agent')}`
      : 'somewhere not specified'
    let remoteUserUrl = ''
    const adminUser = User.findOne({
      where: {
        url: environment.adminUser
      }
    })
    try {
      const headersToValidate = ['(request-target)', 'host', 'date']
      if (req.method === 'POST') {
        headersToValidate.push('digest')
      }

      if (req.header('orig-content-type')) {
        // we need the original value for the signature validation
        req.headers['content-type'] = req.header('orig-content-type')
      }

      const sigHead = httpSignature.parseRequest(req, {
        headers: headersToValidate,
        clockSkew: 3600, // this one is for threads. They have been informed
        strict: true
      })

      if (req.header('orig-content-type')) {
        // roll back to the overridden value for compatibility
        req.headers['content-type'] = 'application/json;charset=UTF-8'
      }

      remoteUserUrl = sigHead.keyId.split('#')[0]
      if (sigHead.keyId.endsWith('/main-key')) {
        remoteUserUrl = sigHead.keyId.split('/main-key')[0]
      }
      hostUrl = new URL(remoteUserUrl).host
      let bannedHostInCache: string | null | undefined = await redisCache.get('server:' + hostUrl)
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
      let remoteKeyData = await getKey(remoteUserUrl, await adminUser)
      let remoteKey
      if (remoteKeyData.key) {
        remoteKey = remoteKeyData.key
      } else {
        // we check for deleted users
        if (
          !force ||
          (req.method === 'POST' &&
            req.body.type == 'Delete' &&
            req.body.actor == req.body.object &&
            req.body.actor == remoteUserUrl)
        ) {
          // well, this is a "delete this user". We should process this ASAP
          req.fediData = {
            fediHost: hostUrl,
            remoteUserUrl: remoteUserUrl,
            valid:
              !force ||
              (req.method === 'POST' &&
                req.body.type == 'Delete' &&
                req.body.actor == req.body.object &&
                req.body.actor == remoteUserUrl)
          }
          next()
          return
        } else {
          // ok you cornered me. forced to fetch the remote actor
          const tmpUser = await getRemoteActor(remoteUserUrl, await adminUser)
          remoteKeyData = await getKey(remoteUserUrl, await adminUser)
          if (remoteKeyData) {
            remoteKey = remoteKeyData.key
          }
          if (!tmpUser || !remoteKey) {
            if (req.body.type != 'Delete') {
              logger.debug({
                message: `Problem finding user for signature`,
                url: req.url,
                body: req.method == 'POST' ? req.body : `GET petition`,
                sigHead: sigHead
              })
            }
            if (force) {
              res.set('Retry-After', '25')
              return res.sendStatus(429)
            }
          }
        }
      }

      success = false

      if (req.method === 'POST') {
        if (verifyDigest(req.rawBody ? req.rawBody : '', req.headers.digest)) {
          if (
            httpSignature.verifySignature(sigHead, remoteKey) &&
            remoteUserUrl.toLowerCase() === req.body.actor.toLowerCase()
          ) {
            success = true
          } else if (req.body.signature && req.body.signature.type === 'RsaSignature2017') {
            // Mastodon allows two kind of signatures on POST bodys, if the http one fails we can check if there's a JSON-LD one, and if it is valid we pass it
            const signature = req.body.signature
            const remoteActor = await getRemoteActor(signature.creator.split('#')[0], await adminUser)
            const jsonld = new LdSignature()

            if (
              await jsonld.verifyRsaSignature2017(req.body, remoteActor.publicKey).catch((error) => {
                logger.debug({
                  message: `Problem with jsonld signature ${hostUrl}: ${remoteUserUrl}`,
                  error: error
                })
              })
            ) {
              success = true
            } else {
              logger.debug(`POST Signature verifications failed for ${hostUrl}: ${remoteUserUrl}`)
              getRemoteActor(remoteUserUrl, await adminUser, true)
                .catch(() => {})
                .then(() => {})
            }
          } else {
            logger.debug(`No valid POST signatures found ${hostUrl}: ${remoteUserUrl}`)
          }
        } else {
          logger.debug(`POST Digest verification failed for ${hostUrl}: ${remoteUserUrl}`)
        }
      } else {
        // GET calls
        success = httpSignature.verifySignature(sigHead, remoteKey)
      }

      if (!success && remoteKeyData?.user) {
        const lastUpdate = new Date(remoteKeyData.user.updatedAt)
        const now = new Date()
        if (now.getTime() - lastUpdate.getTime() > 24 * 3600 * 1000) {
          // while we will still fail this request, we do initiate an async forced update, so if the client retries it'll likely have an updated signature by that time
          getRemoteActor(remoteUserUrl, await adminUser, true)
            .catch(() => {})
            .then(() => {})
        }
      }

      req.fediData = {
        fediHost: hostUrl,
        remoteUserUrl: remoteUserUrl,
        valid: success
      }
    } catch (error: any) {
      req.fediData = { fediHost: hostUrl, valid: false }
      await getRemoteActor(remoteUserUrl, await adminUser, true)
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
      res.sendStatus(401)
      // we failed to get the remote user, we force an update
      await getRemoteActor(remoteUserUrl, await adminUser, true)
      return
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

export { getCheckFediverseSignatureFunction }

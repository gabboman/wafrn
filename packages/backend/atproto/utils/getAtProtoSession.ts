import { AtpAgent } from '@atproto/api'
import { User } from '../../models/index.js'
import { redisCache } from '../../utils/redis.js'
import { completeEnvironment } from '../../utils/backendOptions.js'
import { logger } from '../../utils/logger.js'

async function getAtProtoSession(user?: User): Promise<AtpAgent> {
  const serviceUrl = completeEnvironment.bskyPds.startsWith('http')
    ? completeEnvironment.bskyPds
    : 'https://' + completeEnvironment.bskyPds
  const agent = new AtpAgent({
    service: serviceUrl,
    persistSession: async (evt, session) => {
      if (session && user) {
        // Updated so we do not need to log in on every interaction. Validity is a bit less than 60 seconds so this is safe.
        await redisCache.set('bskySession:' + user.id, JSON.stringify(session), 'EX', 50)
      }
    }
  })
  if (user) {
    const existingSession = await redisCache.get('bskySession:' + user.id)
    let loggedIn = false
    if (existingSession) {
      loggedIn = (await agent.sessionManager.resumeSession(JSON.parse(existingSession))).success
    }
    try {
      if (!loggedIn) {
        await redisCache.del('bskySession:' + user.id)
        await agent.sessionManager.login({
          identifier: user.url + '@' + completeEnvironment.instanceUrl,
          password: (user.bskyAppPassword || user.bskyAuthData) as string
        })
      }
    } catch (error) {
      logger.error({
        message: `Error logging in with bsky user`,
        user: user.url,
        error: error
      })
      throw new Error(`Error login with bluesky: ${user.url}`)
    }
  }

  return agent
}

export { getAtProtoSession }

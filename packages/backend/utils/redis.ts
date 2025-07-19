import { Redis } from 'ioredis'
import { completeEnvironment } from './backendOptions.js'
const redisCache = new Redis(completeEnvironment.redisioConnection)

export { redisCache }

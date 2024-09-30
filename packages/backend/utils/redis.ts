import { environment } from '../environment.js'
import { Redis } from 'ioredis'
const redisCache = new Redis(environment.redisioConnection)

export { redisCache }

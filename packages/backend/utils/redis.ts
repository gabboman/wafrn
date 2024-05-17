import { environment } from '../environment'
import Redis from 'ioredis'
const redisCache = new Redis(environment.redisioConnection)

export { redisCache }

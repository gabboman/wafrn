import express, { Response } from 'express'
import cors from 'cors'
import { environment } from './environment.js'
import { logger } from './utils/logger.js'
import cacheRoutes from './routes/remoteCache.js'
import checkIpBlocked from './utils/checkIpBlocked.js'
import fs from 'fs'

fs.rmSync('cache', { recursive: true, force: true });
fs.mkdirSync('cache')

const PORT = environment.cachePort

const app = express()
app.use(checkIpBlocked)
app.use(cors())
app.set('trust proxy', 1)

cacheRoutes(app)
app.listen(PORT, environment.listenIp, () => {
  logger.info('Started fedi listener')
})

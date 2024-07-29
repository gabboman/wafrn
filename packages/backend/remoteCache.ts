import express, { Response } from 'express'
import cors from 'cors'
import { environment } from './environment'
import { logger } from './utils/logger'
import cacheRoutes from './routes/remoteCache'
import checkIpBlocked from './utils/checkIpBlocked'

const PORT = environment.cachePort

const app = express()
app.use(checkIpBlocked)
app.use(cors())
app.set('trust proxy', 1)

cacheRoutes(app)

app.listen(PORT, environment.listenIp, () => {
  logger.info('Started fedi listener')
})

import express, { Request, Response } from 'express'
import cors from 'cors'
import { environment } from './environment.js'
import { logger } from './utils/logger.js'
import cacheRoutes from './routes/remoteCache.js'
import checkIpBlocked from './utils/checkIpBlocked.js'
import fs from 'fs'

fs.rmSync('cache', { recursive: true, force: true })
fs.mkdirSync('cache')

const PORT = environment.cachePort

const app = express()
function errorHandler(err: Error, req: Request, res: Response, next: Function) {
  console.error(err.stack)
  res.send(500).json({ error: 'Internal Server Error' })
}
app.use(errorHandler)

app.use(checkIpBlocked)
app.use(cors())
app.set('trust proxy', 1)

cacheRoutes(app)
app.listen(PORT, environment.listenIp, () => {
  logger.info('Started fedi listener')
})

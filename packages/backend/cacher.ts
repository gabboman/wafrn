import express, { Response } from 'express'
import { environment } from "./environment"
import cacheRoutes from './routes/remoteCache'
import { logger } from './utils/logger'
import cors from 'cors'

const app = express()
const PORT = environment.cachePort
app.use(cors())

app.use(cacheRoutes)

app.listen(PORT, environment.listenIp, () => {
    logger.info('Started remote cacher')
})
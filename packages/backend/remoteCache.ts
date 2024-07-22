import express, { Response } from 'express'
import cors from 'cors'
import { activityPubRoutes } from './routes/activitypub/activitypub'
import { wellKnownRoutes } from './routes/activitypub/well-known'
import { environment } from './environment'
import overrideContentType from './utils/overrideContentType'
import { logger } from './utils/logger'
import bodyParser from 'body-parser'
import { SignedRequest } from './interfaces/fediverse/signedRequest'
import cacheRoutes from './routes/remoteCache'


const PORT = environment.cachePort



const app = express()
app.use(cors())
app.set('trust proxy', 1)


cacheRoutes(app)

app.listen(PORT, environment.listenIp, () => {
    logger.info('Started fedi listener')
})
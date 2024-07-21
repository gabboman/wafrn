import express, { Response } from 'express'
import cors from 'cors'
import { activityPubRoutes } from './routes/activitypub/activitypub'
import { wellKnownRoutes } from './routes/activitypub/well-known'
import { environment } from './environment'
import overrideContentType from './utils/overrideContentType'
import { logger } from './utils/logger'


const PORT = environment.fediPort



const app = express()
app.use(cors())
app.use(overrideContentType)
app.set('trust proxy', 1)

activityPubRoutes(app)
wellKnownRoutes(app)

app.listen(PORT, environment.listenIp, () => {
    logger.info('Started fedi listener')
})
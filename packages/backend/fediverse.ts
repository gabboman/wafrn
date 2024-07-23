import express, { Response } from 'express'
import cors from 'cors'
import { activityPubRoutes } from './routes/activitypub/activitypub'
import { wellKnownRoutes } from './routes/activitypub/well-known'
import { environment } from './environment'
import overrideContentType from './utils/overrideContentType'
import { logger } from './utils/logger'
import bodyParser from 'body-parser'
import { SignedRequest } from './interfaces/fediverse/signedRequest'
import {pinoHttp} from 'pino-http'


const PORT = environment.fediPort



const app = express()
app.use(pinoHttp())
app.use(cors())
app.use(overrideContentType)
app.set('trust proxy', 1)
app.use(
    bodyParser.json({
      limit: '50mb',
      verify: (req: SignedRequest, res, buf) => {
        req.rawBody = buf.toString()
      }
    })
  )

app.use('/contexts', express.static('contexts'))
activityPubRoutes(app)
wellKnownRoutes(app)

app.listen(PORT, environment.listenIp, () => {
    logger.info('Started fedi listener')
})
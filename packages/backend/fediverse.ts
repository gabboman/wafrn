import express, { Response, Request } from 'express'
import cors from 'cors'
import { activityPubRoutes } from './routes/activitypub/activitypub.js'
import { wellKnownRoutes } from './routes/activitypub/well-known.js'
import overrideContentType from './utils/overrideContentType.js'
import { logger } from './utils/logger.js'
import bodyParser from 'body-parser'
import { SignedRequest } from './interfaces/fediverse/signedRequest.js'
import checkIpBlocked from './utils/checkIpBlocked.js'
import { completeEnvironment } from './utils/backendOptions.js'

const PORT = completeEnvironment.fediPort
const app = express()
function errorHandler(err: Error, req: Request, res: Response, next: Function) {
  console.error(err.stack)
  res.send(500).json({ error: 'Internal Server Error' })
}
app.use(errorHandler)
app.use(cors())
app.use(checkIpBlocked)
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

app.listen(PORT, completeEnvironment.listenIp, () => {
  logger.info('started fedi listener')
})

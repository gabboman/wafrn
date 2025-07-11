import express, { Request, Response } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { environment } from './environment.js'
import { logger } from './utils/logger.js'

import {
  workerInbox,
  workerPrepareSendPost,
  workerGetUser,
  workerSendPostChunk,
  workerProcessFirehose,
  workerDeletePost,
  workerProcessRemotePostView,
  workerProcessRemoteMediaData,
  workerGenerateUserKeyPair
} from './utils/workers.js'

import { SignedRequest } from './interfaces/fediverse/signedRequest.js'
import { activityPubRoutes } from './routes/activitypub/activitypub.js'
import { wellKnownRoutes } from './routes/activitypub/well-known.js'
import adminRoutes from './routes/admin.js'
import blockRoutes from './routes/blocks.js'
import blockUserServerRoutes from './routes/blockUserServer.js'
import dashboardRoutes from './routes/dashboard.js'
import deletePost from './routes/deletePost.js'
import emojiReactRoutes from './routes/emojiReact.js'
import emojiRoutes from './routes/emojis.js'
import followsRoutes from './routes/follows.js'
import forumRoutes from './routes/forum.js'
import { frontend } from './routes/frontend.js'
import likeRoutes from './routes/like.js'
import listRoutes from './routes/lists.js'
import mediaRoutes from './routes/media.js'
import muteRoutes from './routes/mute.js'
import { notificationRoutes } from './routes/notifications.js'
import pollRoutes from './routes/polls.js'
import postsRoutes from './routes/posts.js'
import cacheRoutes from './routes/remoteCache.js'
import searchRoutes from './routes/search.js'
import silencePostRoutes from './routes/silencePost.js'
import statusRoutes from './routes/status.js'
import userRoutes from './routes/users.js'
import checkIpBlocked from './utils/checkIpBlocked.js'
import overrideContentType from './utils/overrideContentType.js'
import swagger from 'swagger-ui-express'
import { readFile } from 'fs/promises'
import { Worker } from 'bullmq'
import expressWs from 'express-ws'
import websocketRoutes from './routes/websocket.js'
import followHashtagRoutes from './routes/followHashtags.js'

function errorHandler(err: Error, req: Request, res: Response, next: Function) {
  console.error(err.stack)
  res.send(500).json({ error: 'Internal Server Error' })
}

const swaggerJSON = JSON.parse(await readFile(new URL('./swagger.json', import.meta.url), 'utf-8'))
// rest of the code remains same
const app = express()
const wsServer = expressWs(app)
const server = wsServer.app
const PORT = environment.port
app.use(errorHandler)
app.use(overrideContentType)
app.use(checkIpBlocked)
app.use(
  bodyParser.json({
    limit: '50mb',
    verify: (req: SignedRequest, res, buf) => {
      req.rawBody = buf.toString()
    }
  })
)
app.use(cors())
app.set('trust proxy', 1)

app.use('/api/apidocs', swagger.serve, swagger.setup(swaggerJSON))

app.get('/api/', (req, res) =>
  res.send({
    status: true,
    swagger: 'API docs at /apidocs',
    readme:
      'welcome to the wafrn api, you better check https://github.com/gabboman/wafrn-backend and https://github.com/gabboman/wafrn to figure out where to poke :D. Also, check api/apidocs'
  })
)

// serve static images
app.use('/api/uploads', express.static('uploads'))

app.use('/api/environment', (req: Request, res: Response) => {
  res.send({
    ...environment.frontendEnvironment,
    webpushPublicKey: environment.webpushPublicKey,
    reviewRegistrations: environment.reviewRegistrations,
    maxUploadSize: environment.uploadLimit
  })
})

userRoutes(app)
followsRoutes(app)
blockRoutes(app)
notificationRoutes(app)
mediaRoutes(app)
postsRoutes(app)
searchRoutes(app)
deletePost(app)
if (environment.fediPort == environment.port) {
  app.use('/contexts', express.static('contexts'))
  activityPubRoutes(app)
  wellKnownRoutes(app)
}
if (environment.cachePort == environment.port) {
  cacheRoutes(app)
}
likeRoutes(app)
emojiReactRoutes(app)
adminRoutes(app)
muteRoutes(app)
blockUserServerRoutes(app)
dashboardRoutes(app)
listRoutes(app)
forumRoutes(app)
silencePostRoutes(app)
statusRoutes(app)
emojiRoutes(app)
pollRoutes(app)
followHashtagRoutes(app)
// just websocket things
websocketRoutes(server)
frontend(app)

server.listen(PORT, environment.listenIp, () => {
  logger.info('started main')
  const workers = [
    workerInbox,
    workerSendPostChunk,
    workerPrepareSendPost,
    workerGetUser,
    workerDeletePost,
    workerProcessRemotePostView,
    workerProcessRemoteMediaData,
    workerGenerateUserKeyPair
  ]
  if (environment.enableBsky) {
    workers.push(workerProcessFirehose as Worker)
  }
  if (environment.workers.mainThread) {
    workers.forEach((worker) => {
      worker.on('error', (err) => {
        logger.warn({
          message: `worker ${worker.name} failed`,
          error: err
        })
      })
    })
  } else {
    workers.forEach(async (worker) => {
      await worker.pause()
    })
  }
})

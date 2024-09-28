import express, { Response } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { environment } from './environment.js'
import { logger } from './utils/logger.js'

import { workerInbox, workerPrepareSendPost, workerGetUser, workerSendPostChunk } from './utils/workers.js'

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
import notificationRoutes from './routes/notifications.js'
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

const swaggerJSON = JSON.parse(await readFile(new URL('./swagger.json', import.meta.url), 'utf-8'))
// rest of the code remains same
const app = express()
const PORT = environment.port

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
      'welcome to the wafrn api, you better check https://github.com/gabboman/wafrn-backend and https://github.com/gabboman/wafrn to figure out where to poke :D. Also, check https://api.wafrn.net/apidocs'
  })
)

// serve static images
app.use('/api/uploads', express.static('uploads'))

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
frontend(app)

app.listen(PORT, environment.listenIp, () => {
  logger.info('Started app')

  if (environment.workers.mainThread) {
    workerInbox.on('completed', (job) => {})

    workerInbox.on('failed', (job, err) => {
      logger.warn(`${job?.id} has failed with ${err.message}`)
    })

    workerPrepareSendPost.on('completed', (job) => {})

    workerPrepareSendPost.on('failed', (job, err) => {
      console.warn(`sending post ${job?.id} has failed with ${err.message}`)
    })

    workerGetUser.on('completed', (job) => {})
    workerGetUser.on('failed', (job, err) => {
      console.debug({ message: `get user ${job?.id} has failed with ${err.message}`, data: job?.data, error: err })
    })

    workerSendPostChunk.on('completed', (job) => {})

    workerSendPostChunk.on('failed', (job, err) => {
      console.warn(`sending post to some inboxes ${job?.id} has failed with ${err.message}`)
    })
  } else {
    workerInbox.pause()
    workerPrepareSendPost.pause()
    workerSendPostChunk.pause()
    // we do the getremoteactor here too
    workerGetUser.pause()
  }
})

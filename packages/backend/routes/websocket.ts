import { Application } from 'express-ws'
import { WebSocket } from 'ws'
import { Response, Request } from 'express'
import { logger } from '../utils/logger.js'
import jwt from 'jsonwebtoken'
import { Job, Worker } from 'bullmq'
// forgive me @javascript@app.wafrn.net
import { BehaviorSubject, debounceTime, filter, Subscription } from 'rxjs'
import { completeEnvironment } from '../utils/backendOptions.js'

export default function websocketRoutes(app: Application) {
  const notificationEmitter: BehaviorSubject<{ type: string; userId: string }> = new BehaviorSubject({
    type: '',
    userId: ''
  })
  new Worker(
    'updateNotificationsSocket',
    async (job: Job) => {
      // TODO send notifications!
      const userId = job.data.userId ? job.data.userId : ''
      notificationEmitter.next({ userId, type: job.data.type })
    },
    {
      connection: completeEnvironment.bullmqConnection,
      concurrency: 1,
      lockDuration: 120000
    }
  )
  app.ws('/api/notifications/socket', async (ws: WebSocket, req: Request) => {
    let authorized = false
    let procesingAuth = false
    let userId: string | undefined
    let subscriptions: Subscription[] = []

    ws.on('message', (msg: string) => {
      let msgAsObject: { type: 'auth' | 'NOTVALID'; object: any } = { type: 'NOTVALID', object: null }
      // we try to convert the object to something valid
      try {
        msgAsObject = JSON.parse(msg)
      } catch (error) {
        logger.debug({
          message: `Socket message not valid json`,
          error: error,
          socketMsg: msg
        })
      }
      if (msgAsObject && msgAsObject.type && msgAsObject.object) {
        switch (msgAsObject.type) {
          // yep we are gona go fedi inbox type as this seems the only way.
          // For now we will only recive one type of action from the client through websocket
          case 'auth': {
            // the object is the bearer token
            if (typeof msgAsObject.object === 'string') {
              const token = msgAsObject.object
              jwt.verify(token, completeEnvironment.jwtSecret, async (err: any, jwtData: any) => {
                if (err) {
                  ws.close()
                }
                if (!jwtData?.userId) {
                  ws.close()
                } else {
                  authorized = true
                  userId = jwtData.userId
                  const myNotifications = notificationEmitter.pipe(
                    filter((notification) => userId === notification.userId)
                  )
                  subscriptions.push(
                    myNotifications.subscribe((elem) => {
                      ws.send(JSON.stringify({ message: 'update_notifications', type: elem.type }))
                    })
                  )
                }
              })
            } else {
              ws.close()
            }
            break
          }
          default: {
            logger.debug({
              message: `Socket invalid message type: ${msgAsObject.type}`,
              socketMessage: msg
            })
          }
        }
      }
    })

    ws.on('close', (msg: string) => {
      for (const subscription of subscriptions) {
        subscription.unsubscribe()
      }
    })

    // if it has been one second and user has not started the auth process, time to kill this process
    // if user failed auth and for any destiny's reason we are still on it
    // in case of failure the auth part would take care of killing the connection
    setTimeout(() => {
      if (!authorized && !procesingAuth) {
        ws.close()
      }
    }, 1000)
  })
}

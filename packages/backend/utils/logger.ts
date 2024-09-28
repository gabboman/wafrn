import { environment } from '../environment.js'

const pino = require('pino')
const transport = pino.transport(environment.pinoTransportOptions)

export const logger = pino(
  {
    level: environment.logLevel,
    timestamp: pino.stdTimeFunctions.isoTime
  },
  transport
)

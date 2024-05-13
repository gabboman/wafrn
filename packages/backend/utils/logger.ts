import { environment } from '../environment'

const pino = require('pino')
const transport = pino.transport(environment.pinoTransportOptions)

export const logger = pino(
  {
    level: environment.logLevel,
    timestamp: pino.stdTimeFunctions.isoTime
  },
  transport
)

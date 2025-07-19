import { pino } from 'pino'
import { completeEnvironment } from './backendOptions.js'

const transport = pino.transport(completeEnvironment.pinoTransportOptions as any)

export const logger = pino(
  {
    level: completeEnvironment.logLevel,
    timestamp: pino.stdTimeFunctions.isoTime
  },
  transport
)

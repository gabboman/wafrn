/*
 * We expand the env
 */

import { baseEnvironment } from '../environment.js'
import { Environment } from '../interfaces/environment.js'

export const completeEnvironment: Environment = {
  ...baseEnvironment,
  bskyPdsUrl: baseEnvironment.bskyPdsUrl ? baseEnvironment.bskyPdsUrl : baseEnvironment.bskyPds
}

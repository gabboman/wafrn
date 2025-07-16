/*
 * We expand the env
 */

import { environment } from '../environment.js'
import { Environment } from '../interfaces/environment.js'

export const completeEnvironment: Environment = {
  ...environment,
  bskyPdsUrl: environment.bskyPdsUrl ? environment.bskyPdsUrl : environment.bskyPds
}

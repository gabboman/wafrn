/*
 * We expand the env
 */

import { baseEnvironment } from '../environment.js'
import { Environment } from '../interfaces/environment.js'

export const completeEnvironment = {
  ...baseEnvironment,
  bskyPdsUrl: baseEnvironment.bskyPdsUrl ? baseEnvironment.bskyPdsUrl : baseEnvironment.bskyPds,
  frontendEnvironment: {
    ...baseEnvironment.frontendEnvironment,
    enableBsky: baseEnvironment.enableBsky,
    baseUrl:
      baseEnvironment.frontendEnvironment.baseUrl === '/api'
        ? `${baseEnvironment.frontendUrl}/api`
        : baseEnvironment.frontendEnvironment.baseUrl
  // the 'satisfies' keyword is used to tell typescript that this object is fits with type Environment but can extend it
  // for example, to make the 'bskyPdsUrl' property not optional
  } satisfies Environment 
}

import { environment } from '../environment.js'
import { logger } from '../utils/logger.js'
import { Sequelize } from 'sequelize-typescript'
import { beforeFindAfterExpandIncludeAll, afterFind } from './hierarchy/hierarchy.js'

const sequelize = new Sequelize(environment.databaseConnectionString, {
  benchmark: true,
  logging: (sql: any, time?: number) => {
    if (environment.logSQLQueries) {
      logger.trace({ duration: time, query: sql })
    } else if (time && time > 2500) {
      logger.warn({ duration: time, query: sql })
    }
  },
  dialectOptions: {
    connectTimeout: 10000
  },
  pool: {
    max: 40,
    min: 2,
    acquire: 30000,
    idle: 5000
  },
  retry: {
    max: environment.prod ? 3 : 0,
    backoffBase: 100, // Initial backoff duration in ms. Default: 100,
    backoffExponent: 1.1 // Exponent to increase backoff each try. Default: 1.1
  }
})

sequelize.addHook('beforeFindAfterExpandIncludeAll', 'hierarchyPreCheck', beforeFindAfterExpandIncludeAll)
sequelize.addHook('afterFind', 'hierarchyPostProcess', afterFind)

export { sequelize, Sequelize };

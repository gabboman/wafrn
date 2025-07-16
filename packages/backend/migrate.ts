import { Sequelize } from 'sequelize'
import { Umzug, SequelizeStorage } from 'umzug'
import process from 'process'
import { realpathSync } from 'fs'
import { pathToFileURL } from 'url'
import { completeEnvironment } from './utils/backendOptions.js'

function wasCalledAsScript() {
  const realPath = realpathSync(process.argv[1])
  const realPathAsUrl = pathToFileURL(realPath).href
  return import.meta.url === realPathAsUrl
}

const sequelize = new Sequelize(completeEnvironment.databaseConnectionString)

const umzug = new Umzug({
  migrations: { glob: 'migrations/*.ts' },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console
})

// export the type helper exposed by umzug, which will have the `context` argument typed correctly
export type Migration = typeof umzug._types.migration

if (wasCalledAsScript()) {
  if (process.argv[2] == 'init-container') {
    await umzug.up()
    console.log('Migrations run successfully')
    process.exit(0)
  } else {
    await umzug.runAsCLI()
  }
}

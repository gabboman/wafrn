import { DataTypes, Sequelize, UUIDV4 } from 'sequelize'
import { Migration } from '../migrate.js'
import { FederatedHost } from '../models/federatedHost.js'
import { User } from '../models/user.js'
import { DataType } from 'sequelize-typescript'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.addColumn('blocks', 'bskyPath', {
    type: DataTypes.STRING(768),
    allowNull: true
  })
  await queryInterface.sequelize.query(`CREATE UNIQUE INDEX blocks_bsky_path ON "blocks" ("bskyPath");`)
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.sequelize.query(`DROP INDEX blocks_bsky_path`)
  await queryInterface.removeColumn('blocks', 'bskyPath')
}

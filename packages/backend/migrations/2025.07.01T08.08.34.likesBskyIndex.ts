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
  await queryInterface.sequelize.query(
    `CREATE INDEX userlikespostrelations_bskypath_idx ON public."userLikesPostRelations" ("bskyPath");`
  )
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.sequelize.query(`DROP INDEX userlikespostrelations_bskypath_idx`)
}

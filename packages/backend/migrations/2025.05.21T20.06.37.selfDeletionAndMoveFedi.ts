import { DataTypes, Sequelize } from 'sequelize'
import { Migration } from '../migrate.js'
import { FederatedHost } from '../models/federatedHost.js'
import { User } from '../models/user.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.addColumn('users', 'selfDeleted', {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false
  })
  await queryInterface.addColumn('users', 'userMigratedTo', {
    type: DataTypes.STRING(768),
    allowNull: true
  })
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.removeColumn('users', 'selfDeleted')
  await queryInterface.removeColumn('users', 'userMigratedTo')
}

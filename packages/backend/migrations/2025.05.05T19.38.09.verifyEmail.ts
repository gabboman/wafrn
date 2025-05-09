import { DataTypes, Sequelize } from 'sequelize'
import { Migration } from '../migrate.js'
import { FederatedHost } from '../models/federatedHost.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.addColumn('users', 'emailVerified', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true
  })
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.removeColumn('users', 'emailVerified')
}

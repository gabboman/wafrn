import { DataTypes, Sequelize } from 'sequelize'
import { Migration } from '../migrate.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.addColumn('users', 'hideProfileNotLoggedIn', { type: DataTypes.BOOLEAN, defaultValue: false })
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.removeColumn('users', 'hideProfileNotLoggedIn')
}

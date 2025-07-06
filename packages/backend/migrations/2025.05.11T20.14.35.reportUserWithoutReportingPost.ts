import { DataTypes, Sequelize } from 'sequelize'
import { Migration } from '../migrate.js'
import { FederatedHost } from '../models/federatedHost.js'
import { User } from '../models/user.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.addColumn('postReports', 'reportedUserId', {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: {
        tableName: 'users'
      }
    }
  })
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.removeColumn('postReports', 'reportedUserId')
}

import { DataTypes, Sequelize } from 'sequelize'
import { Migration } from '../migrate.js'
import { FederatedHost } from '../models/federatedHost.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.removeColumn('bskyInviteCodes', 'createdAt')
  await queryInterface.removeColumn('bskyInviteCodes', 'updatedAt')
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.addColumn('bskyInviteCodes', 'createdAt', {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: true
  })
  await queryInterface.addColumn('bskyInviteCodes', 'updatedAt', {
    type: DataTypes.DATE,
    defaultValue: new Date(),
    allowNull: true
  })
}

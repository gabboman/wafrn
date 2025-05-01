import { DataTypes, Sequelize } from 'sequelize'
import { Migration } from '../migrate.js'
import { FederatedHost } from '../models/federatedHost.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.addColumn('federatedHosts', 'bubbleTimeline', {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true
  })
  await queryInterface.bulkUpdate(
    'federatedHosts',
    {
      bubbleTimeline: true
    },
    { friendServer: true }
  )
}
export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.removeColumn('federatedHosts', 'bubbleTimeline')
}

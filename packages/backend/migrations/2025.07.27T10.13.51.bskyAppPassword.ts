import { DataTypes } from 'sequelize';
import { Migration } from '../migrate.js'

export const up: Migration = async params => {
  const queryInterface = params.context
  await queryInterface.addColumn('users', 'bskyAppPassword', {
    type: DataTypes.STRING,
    allowNull: true
  })
};
export const down: Migration = async params => {
  const queryInterface = params.context
  await queryInterface.removeColumn('users', 'bskyAppPassword')
};

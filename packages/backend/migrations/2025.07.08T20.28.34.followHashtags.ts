import { DataTypes } from 'sequelize'
import { Migration } from '../migrate.js'

export const up: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.createTable('userFollowHashtags', {
    userId: { type: DataTypes.UUID, primaryKey: true, allowNull: false, references: { model: 'users', key: 'id' } },
    tagName: { type: DataTypes.STRING(256), primaryKey: true, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: new Date() },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: new Date() }
  })
}

export const down: Migration = async (params) => {
  const queryInterface = params.context
  await queryInterface.dropTable('userFollowHashtags')
}

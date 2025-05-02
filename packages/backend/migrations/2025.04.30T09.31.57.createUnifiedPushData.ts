import { DataTypes } from 'sequelize';
import { Migration } from '../migrate.js';

export const up: Migration = async params => {
  const queryInterface = params.context
  await queryInterface.createTable('unifiedPushData', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    userId: { type: DataTypes.UUID, allowNull: false },
    endpoint: { type: DataTypes.STRING, allowNull: false },
    deviceAuth: { type: DataTypes.STRING, allowNull: false },
    devicePublicKey: { type: DataTypes.STRING, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
};

export const down: Migration = async params => {
  const queryInterface = params.context
  await queryInterface.dropTable('unifiedPushData')
}

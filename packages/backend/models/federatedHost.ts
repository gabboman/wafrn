import { sequelize, Sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const FederatedHost = sequelize.define(
  'federatedHosts',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    displayName: DataTypes.TEXT,
    publicInbox: DataTypes.TEXT,
    publicKey: DataTypes.TEXT,
    detail: DataTypes.STRING,
    blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    friendServer: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['blocked']
      },
      {
        unique: true,
        fields: [Sequelize.fn('lower', Sequelize.col('displayName'))]
      }
    ]
  }
)

export default FederatedHost;

import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const MfaDetails = sequelize.define(
  'mfaDetails',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      },
      unique: false
    },
    type: DataTypes.STRING,
    name: DataTypes.STRING,
    data: DataTypes.JSON,
    lastUsedData: DataTypes.JSON,
    enabled: DataTypes.BOOLEAN
  },
  {
    indexes: [
      {
        fields: ['userId'],
        unique: false
      }
    ]
  }
)

export default MfaDetails

import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const PushNotificationToken = sequelize.define(
  'pushNotificationTokens',
  {
    token: {
      type: DataTypes.STRING(768),
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['token']
      },
      {
        unique: false,
        fields: ['userId']
      }
    ]
  }
)

export default PushNotificationToken

import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const Notification = sequelize.define(
  'notifications',
  {
    notificationType: DataTypes.STRING(128)
  },
  {
    indexes: [
      {
        fields: ['notifiedUserId'],
        unique: false
      },
      {
        fields: ['notifiedUserId', 'createdAt'],
        unique: false
      },
      {
        fields: ['notificationType', 'postId'],
        unique: false
      },
      {
        fields: ['userId'],
        unique: false
      },
      {
        fields: ['postId'],
        unique: false
      }
    ]
  }
)

export default Notification

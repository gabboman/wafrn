import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const Follows = sequelize.define(
  'follows',
  {
    remoteFollowId: {
      type: DataTypes.STRING(768),
      allowNull: true,
      unique: true
    },
    accepted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    bskyUri: {
      type: DataTypes.STRING(768),
      allowNull: true,
      unique: true
    },
    bskyPath: {
      type: DataTypes.STRING(768),
      allowNull: true,
      unique: true
    }
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['followerId']
      },
      {
        unique: false,
        fields: ['followedId']
      },
      {
        unique: true,
        fields: ['followedId', 'followerId']
      },
      {
        unique: false,
        fields: ['followedId', 'accepted']
      }
    ]
  }
)

export default Follows

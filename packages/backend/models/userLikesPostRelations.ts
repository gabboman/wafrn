import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";
import User from "./user.js";
import Post from "./post.js";

const UserLikesPostRelations = sequelize.define(
  'userLikesPostRelations',
  {
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
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'posts',
        key: 'id'
      },
      unique: false
    },
    remoteId: {
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
        fields: [
          {
            attribute: 'postId'
          }
        ]
      }
    ]
  }
)

export default UserLikesPostRelations

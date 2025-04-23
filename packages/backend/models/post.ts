import { sequelize } from "./sequelize.js"
import { DataTypes } from "sequelize"

const Post = sequelize.define(
  'posts',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    content_warning: DataTypes.TEXT,
    content: DataTypes.TEXT,
    markdownContent: DataTypes.TEXT,
    title: {
      type: DataTypes.STRING(256),
      allowNull: true,
      unique: false
    },
    remotePostId: {
      type: DataTypes.STRING(768),
      allowNull: true,
      unique: true
    },
    bskyUri: DataTypes.STRING(768),
    bskyCid: DataTypes.STRING(768),
    privacy: DataTypes.INTEGER,
    featured: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    isReblog: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['parentId']
      },
      {
        unique: false,
        fields: ['userId']
      },
      {
        unique: false,
        fields: ['createdAt']
      },
      {
        unique: false,
        fields: ['createdAt', 'userId']
      },
      {
        unique: false,
        fields: ['createdAt', 'privacy']
      },
      {
        unique: false,
        fields: ['featured']
      },
      {
        unique: true,
        fields: ['userId', 'title']
      },
      {
        unique: false,
        fields: ['isReblog']
      },
      {
        unique: false,
        fields: ['isReblog', 'parentId']
      }
    ]
  }
)

export default Post

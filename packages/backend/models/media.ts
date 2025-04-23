import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const Media = sequelize.define(
  'medias',
  {
    mediaOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    NSFW: DataTypes.BOOLEAN,
    description: DataTypes.TEXT,
    url: DataTypes.TEXT,
    ipUpload: DataTypes.STRING,
    external: {
      defaultValue: false,
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    mediaType: DataTypes.STRING,
    width: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    height: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    blurhash: DataTypes.STRING
  },
  {
    indexes: [
      {
        fields: ['postId'],
        unique: false
      }
    ]
  }
)

export default Media

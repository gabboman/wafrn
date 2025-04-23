import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const PostTag = sequelize.define(
  'postTags',
  {
    tagName: DataTypes.TEXT
  },
  {
    indexes: [
      {
        unique: false,
        fields: [sequelize.fn('lower', sequelize.col('tagName'))]
      },
      {
        fields: ['postId']
      }
    ]
  }
)

export default PostTag

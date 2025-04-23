import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const UserBookmarkedPosts = sequelize.define('userBookmarkedPosts', {
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
  }
})

export default UserBookmarkedPosts

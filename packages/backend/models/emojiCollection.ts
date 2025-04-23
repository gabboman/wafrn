import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const EmojiCollection = sequelize.define('emojiCollections', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true
  },
  name: DataTypes.STRING,
  comment: {
    allowNull: true,
    type: DataTypes.TEXT
  }
})

export default EmojiCollection

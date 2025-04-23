import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const EmojiReaction = sequelize.define(
  'emojiReaction',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    remoteId: {
      type: DataTypes.STRING(768),
      allowNull: true,
      unique: true
    },
    content: DataTypes.TEXT
  },
  {
    indexes: [
      {
        unique: true,
        fields: [
          {
            attribute: 'remoteId',
            type: 'FULLTEXT'
          }
        ]
      }
    ]
  }
)

export default EmojiReaction

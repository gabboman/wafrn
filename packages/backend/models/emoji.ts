import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const Emoji = sequelize.define(
  'emojis',
  {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    name: DataTypes.STRING,
    url: DataTypes.TEXT,
    external: DataTypes.BOOLEAN
  },
  {
    indexes: [
      {
        unique: false,
        fields: [
          {
            attribute: 'name'
          },
          {
            attribute: 'external'
          }
        ]
      }
    ]
  }
)

export default Emoji

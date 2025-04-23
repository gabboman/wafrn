import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const Blocks = sequelize.define(
  'blocks',
  {
    remoteBlockId: {
      type: DataTypes.STRING(768),
      allowNull: true,
      unique: true
    },
    reason: DataTypes.TEXT
  },
  {
    indexes: [
      {
        unique: false,
        fields: ['blockerId']
      },
      {
        unique: false,
        fields: ['blockedId']
      },
      {
        unique: true,
        fields: ['blockedId', 'blockerId']
      }
    ]
  }
)

export default Blocks

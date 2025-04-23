import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const UserOptions = sequelize.define(
  'userOptions',
  {
    userId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    optionName: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    optionValue: DataTypes.TEXT,
    public: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    }
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['userId', 'optionName']
      },
      {
        unique: false,
        fields: ['userId']
      }
    ]
  }
)

export default UserOptions;

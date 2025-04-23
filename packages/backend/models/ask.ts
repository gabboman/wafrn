import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const Ask = sequelize.define(
  'asks',
  {
    question: DataTypes.TEXT,
    apObject: DataTypes.TEXT,
    creationIp: DataTypes.STRING,
    answered: DataTypes.BOOLEAN
  },
  {
    indexes: [
      {
        fields: ['answered'],
        unique: false
      },
      {
        fields: ['creationIp'],
        unique: false
      },
      {
        fields: ['createdAt'],
        unique: false
      }
    ]
  }
)

export default Ask

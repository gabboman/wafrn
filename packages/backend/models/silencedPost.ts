import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const SilencedPost = sequelize.define('silencedPost', {
  superMuted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: true
  }
})

export default SilencedPost

import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const Mutes = sequelize.define('mutes', {
  reason: DataTypes.TEXT
})

export default Mutes

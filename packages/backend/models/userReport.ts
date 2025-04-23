import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const UserReport = sequelize.define('userReports', {
  resolved: DataTypes.BOOLEAN,
  severity: DataTypes.INTEGER,
  description: DataTypes.TEXT
})

export default UserReport

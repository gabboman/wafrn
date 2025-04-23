import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const PostReport = sequelize.define('postReports', {
  resolved: DataTypes.BOOLEAN,
  severity: DataTypes.INTEGER,
  description: DataTypes.TEXT
})

export default PostReport

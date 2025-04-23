import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const BskyInviteCodes = sequelize.define('bskyInviteCodes', {
  code: DataTypes.STRING(512)
})

export default BskyInviteCodes

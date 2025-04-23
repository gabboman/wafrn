import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const QuestionPollAnswer = sequelize.define('questionPollAnswer', {
  remoteId: {
    type: DataTypes.STRING(768),
    allowNull: true,
    unique: true
  }
})

export default QuestionPollAnswer

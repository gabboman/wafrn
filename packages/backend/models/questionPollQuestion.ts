import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const QuestionPollQuestion = sequelize.define('questionPollQuestion', {
  questionText: DataTypes.TEXT,
  index: DataTypes.INTEGER,
  remoteReplies: DataTypes.INTEGER
})

export default QuestionPollQuestion

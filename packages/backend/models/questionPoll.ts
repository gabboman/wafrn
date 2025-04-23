import { sequelize } from "./sequelize.js";
import { DataTypes } from "sequelize";

const QuestionPoll = sequelize.define('questionPoll', {
  endDate: DataTypes.DATE,
  multiChoice: DataTypes.BOOLEAN
})

export default QuestionPoll

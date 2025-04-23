import {
  Model, Table, Column, DataType, Sequelize, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { QuestionPoll } from "./questionPoll.js";

export interface QuestionPollQuestionAttributes {
  questionText?: string;
  index?: number;
  remoteReplies?: number;
  questionPollId?: number;
}

@Table({
  tableName: "questionPollQuestions",
  timestamps: true
})
export class QuestionPollQuestion extends Model<QuestionPollQuestionAttributes, QuestionPollQuestionAttributes> implements QuestionPollQuestionAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  questionText?: string;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  index?: number;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  remoteReplies?: number;

  @ForeignKey(() => QuestionPoll)
  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  questionPollId?: number;

  @BelongsTo(() => QuestionPoll)
  questionPoll?: QuestionPoll;
}

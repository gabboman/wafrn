import {
  Model, Table, Column, DataType, Sequelize, ForeignKey, BelongsTo,
  HasMany
} from "sequelize-typescript";
import { QuestionPoll } from "./questionPoll.js";
import { QuestionPollAnswer } from "./questionPollAnswer.js";

export interface QuestionPollQuestionAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  questionText?: string;
  index?: number;
  remoteReplies?: number;
  questionPollId?: number;
}

@Table({
  tableName: "questionPollQuestions",
  modelName: "questionPollQuestions",
  timestamps: true
})
export class QuestionPollQuestion extends Model<QuestionPollQuestionAttributes, QuestionPollQuestionAttributes> implements QuestionPollQuestionAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare questionText: string;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  declare index: number;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  declare remoteReplies: number;

  @ForeignKey(() => QuestionPoll)
  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  declare questionPollId: number;

  @BelongsTo(() => QuestionPoll)
  declare questionPoll: QuestionPoll;

  @HasMany(() => QuestionPollAnswer)
  declare questionPollAnswers: QuestionPollAnswer;
}

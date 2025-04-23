import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { QuestionPollQuestion } from "./questionPollQuestion.js";
import { User } from "./user.js";

export interface QuestionPollAnswerAttributes {
  remoteId?: string;
  questionPollQuestionId?: number;
  userId?: string;
}

@Table({
  tableName: "questionPollAnswers",
  timestamps: true
})
export class QuestionPollAnswer extends Model<QuestionPollAnswerAttributes, QuestionPollAnswerAttributes> implements QuestionPollAnswerAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  remoteId?: string;

  @ForeignKey(() => QuestionPollQuestion)
  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  questionPollQuestionId?: number;

  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  userId?: string;

  @BelongsTo(() => QuestionPollQuestion, "questionPollQuestionId")
  questionPollQuestion?: QuestionPollQuestion;

  @BelongsTo(() => User, "userId")
  user?: User;
}

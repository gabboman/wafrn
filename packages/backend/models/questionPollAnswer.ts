import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { QuestionPollQuestion } from "./questionPollQuestion.js";
import { User } from "./user.js";

export interface QuestionPollAnswerAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  remoteId?: string;
  questionPollQuestionId?: number;
  userId?: string;
}

@Table({
  tableName: "questionPollAnswers",
  modelName: "questionPollAnswers",
  timestamps: true
})
export class QuestionPollAnswer extends Model<QuestionPollAnswerAttributes, QuestionPollAnswerAttributes> implements QuestionPollAnswerAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare remoteId: string;

  @ForeignKey(() => QuestionPollQuestion)
  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  declare questionPollQuestionId: number;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare userId: string;

  @BelongsTo(() => QuestionPollQuestion, "questionPollQuestionId")
  declare questionPollQuestion: QuestionPollQuestion;

  @BelongsTo(() => User, "userId")
  declare user: User;
}

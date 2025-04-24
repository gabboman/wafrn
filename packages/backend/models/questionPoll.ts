import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo,
  HasMany
} from "sequelize-typescript";
import { Post } from "./post.js";
import { QuestionPollQuestion } from "./questionPollQuestion.js";
import { HasManyGetAssociationsMixin } from "sequelize";

export interface QuestionPollsAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  endDate?: Date;
  multiChoice?: boolean;
  postId?: string;
}

@Table({
  tableName: "questionPolls",
  modelName: "questionPolls",
  timestamps: true
})
export class QuestionPoll extends Model<QuestionPollsAttributes, QuestionPollsAttributes> implements QuestionPollsAttributes {
  @Column({
    allowNull: true,
    type: DataType.DATE
  })
  declare endDate: Date;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  declare multiChoice: boolean;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare postId: string;

  @BelongsTo(() => Post, "postId")
  declare post: Post;

  @HasMany(() => QuestionPollQuestion)
  declare questionPollQuestions: QuestionPollQuestion[]
  declare getQuestionPollQuestions: HasManyGetAssociationsMixin<QuestionPollQuestion>
}

import {
  Model, Table, Column, DataType, Index, Sequelize, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";

export interface QuestionPollsAttributes {
  endDate?: Date;
  multiChoice?: boolean;
  postId?: string;
}

@Table({
  tableName: "questionPolls",
  timestamps: true
})
export class QuestionPoll extends Model<QuestionPollsAttributes, QuestionPollsAttributes> implements QuestionPollsAttributes {
  @Column({
    allowNull: true,
    type: DataType.DATE
  })
  endDate?: Date;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  multiChoice?: boolean;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  postId?: string;

  @BelongsTo(() => Post, "postId")
  post?: Post;
}

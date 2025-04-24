import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";

export interface QuotesAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  quoterPostId: string;
  quotedPostId: string;
}

@Table({
  tableName: "quotes",
  modelName: "quotes",
  timestamps: true
})
export class Quotes extends Model<QuotesAttributes, QuotesAttributes> implements QuotesAttributes {
  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare quoterPostId: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare quotedPostId: string;

  @BelongsTo(() => Post, "quoterPostId")
  declare quoterPost: Post;

  @BelongsTo(() => Post, "quotedPostId")
  declare quotedPost: Post;
}

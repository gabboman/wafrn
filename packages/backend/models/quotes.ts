import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";

export interface QuotesAttributes {
  quoterPostId: string;
  quotedPostId: string;
}

@Table({
  tableName: "quotes",
  timestamps: true
})
export class Quotes extends Model<QuotesAttributes, QuotesAttributes> implements QuotesAttributes {
  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  quoterPostId!: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  quotedPostId!: string;

  @BelongsTo(() => Post, "quoterPostId")
  quoterPost?: Post;

  @BelongsTo(() => Post, "quotedPostId")
  quotedPost?: Post;
}

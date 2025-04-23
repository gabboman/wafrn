import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";

export interface PostTagAttributes {
  tagName?: string;
  postId?: string;
}

@Table({
  tableName: "postTags",
  timestamps: true
})
export class PostTag extends Model<PostTagAttributes, PostTagAttributes> implements PostTagAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  tagName?: string;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  postId?: string;

  @BelongsTo(() => Post, "postId")
  post?: Post;
}

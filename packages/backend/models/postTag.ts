import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";

export interface PostTagAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  tagName?: string;
  postId?: string;
}

@Table({
  tableName: "postTags",
  modelName: "postTags",
  timestamps: true
})
export class PostTag extends Model<PostTagAttributes, PostTagAttributes> implements PostTagAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare tagName: string;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare postId: string;

  @BelongsTo(() => Post, "postId")
  declare post: Post;
}

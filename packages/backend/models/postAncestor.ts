import {
  Model, Table, Column, DataType, ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";

export interface PostAncestorAttributes {
  postsId: string;
  ancestorId: string;
}

@Table({
  tableName: "postsancestors",
  timestamps: false
})
export class PostAncestor extends Model<PostAncestorAttributes, PostAncestorAttributes> implements PostAncestorAttributes {
  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  postsId!: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  ancestorId!: string;

  @BelongsTo(() => Post, "postId")
  post?: Post

  @BelongsTo(() => Post, "ancestorId")
  ancestor?: Post
}

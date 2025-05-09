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
  modelName: "postsancestors",
  timestamps: false
})
export class PostAncestor extends Model<PostAncestorAttributes, PostAncestorAttributes> implements PostAncestorAttributes {
  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare postsId: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare ancestorId: string;

  @BelongsTo(() => Post, "postsId")
  declare post: Post

  @BelongsTo(() => Post, "ancestorId")
  declare ancestor: Post
}

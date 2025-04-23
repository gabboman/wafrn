import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface UserBookmarkedPostsAttributes {
  userId: string;
  postId: string;
}

@Table({
  tableName: "userBookmarkedPosts",
  timestamps: true
})
export class UserBookmarkedPosts extends Model<UserBookmarkedPostsAttributes, UserBookmarkedPostsAttributes> implements UserBookmarkedPostsAttributes {

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  userId!: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  postId!: string;

  @BelongsTo(() => User, "userId")
  user?: User;

  @BelongsTo(() => Post, "postId")
  post?: Post;
}

import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface UserBookmarkedPostsAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
  postId: string;
}

@Table({
  tableName: "userBookmarkedPosts",
  modelName: "userBookmarkedPosts",
  timestamps: true
})
export class UserBookmarkedPosts extends Model<UserBookmarkedPostsAttributes, UserBookmarkedPostsAttributes> implements UserBookmarkedPostsAttributes {

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare userId: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare postId: string;

  @BelongsTo(() => User, "userId")
  declare user: User;

  @BelongsTo(() => Post, "postId")
  declare post: Post;
}

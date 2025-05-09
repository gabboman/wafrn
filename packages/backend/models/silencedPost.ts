import {
  Model, Table, Column, DataType, Sequelize, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";
import { User } from "./user.js";

export interface SilencedPostAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  superMuted?: boolean;
  userId?: string;
  postId?: string;
}

@Table({
  tableName: "silencedPosts",
  modelName: "silencedPosts",
  timestamps: true
})
export class SilencedPost extends Model<SilencedPostAttributes, SilencedPostAttributes> implements SilencedPostAttributes {
  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: Sequelize.literal("false")
  })
  declare superMuted: boolean;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare userId: string;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare postId: string;

  @BelongsTo(() => Post, "postId")
  declare post: Post;

  @BelongsTo(() => User, "userId")
  declare user: User;
}

import {
  Model, Table, Column, DataType, Sequelize, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";
import { User } from "./user.js";

export interface SilencedPostAttributes {
  superMuted?: boolean;
  userId?: string;
  postId?: string;
}

@Table({
  tableName: "silencedPosts",
  timestamps: true
})
export class SilencedPost extends Model<SilencedPostAttributes, SilencedPostAttributes> implements SilencedPostAttributes {
  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: Sequelize.literal("false")
  })
  superMuted?: boolean;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  userId?: string;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  postId?: string;

  @BelongsTo(() => Post, "postId")
  post?: Post;

  @BelongsTo(() => User, "userId")
  user?: User;
}

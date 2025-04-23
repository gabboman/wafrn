import {
  Model, Table, Column, DataType, Index, Sequelize, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface UserLikesPostRelationsAttributes {
  userId: string;
  postId: string;
  remoteId?: string;
  bskyPath?: string;
}

@Table({
  tableName: "userLikesPostRelations",
  timestamps: true
})
export class UserLikesPostRelations extends Model<UserLikesPostRelationsAttributes, UserLikesPostRelationsAttributes> implements UserLikesPostRelationsAttributes {

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

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  remoteId?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  bskyPath?: string;

  @BelongsTo(() => User, "userId")
  user?: User;

  @BelongsTo(() => Post, "postId")
  post?: Post;

}

import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface UserLikesPostRelationsAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
  postId: string;
  remoteId?: string;
  bskyPath?: string;
}

@Table({
  tableName: "userLikesPostRelations",
  modelName: "userLikesPostRelations",
  timestamps: true
})
export class UserLikesPostRelations extends Model<UserLikesPostRelationsAttributes, UserLikesPostRelationsAttributes> implements UserLikesPostRelationsAttributes {

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

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare remoteId: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare bskyPath: string;

  @BelongsTo(() => User, "userId")
  declare user: User;

  @BelongsTo(() => Post, "postId")
  declare post: Post;

}

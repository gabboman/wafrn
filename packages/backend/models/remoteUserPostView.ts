import {
  Model, Table, Column, DataType, Index, Sequelize, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";
import { User } from "./user.js";

export interface RemoteUserPostViewAttributes {
  postId: string;
  userId: string;
}

@Table({
  tableName: "remoteUserPostViews",
  timestamps: true
})
export class RemoteUserPostView extends Model<RemoteUserPostViewAttributes, RemoteUserPostViewAttributes> implements RemoteUserPostViewAttributes {
  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  postId!: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  userId!: string;

  @BelongsTo(() => Post, "postId")
  Post?: Post;

  @BelongsTo(() => User, "userId")
  User?: User;

}

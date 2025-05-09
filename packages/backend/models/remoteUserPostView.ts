import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";
import { User } from "./user.js";

export interface RemoteUserPostViewAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  postId: string;
  userId: string;
}

@Table({
  tableName: "remoteUserPostViews",
  modelName: "remoteUserPostViews",
  timestamps: true
})
export class RemoteUserPostView extends Model<RemoteUserPostViewAttributes, RemoteUserPostViewAttributes> implements RemoteUserPostViewAttributes {
  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare postId: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare userId: string;

  @BelongsTo(() => Post, "postId")
  declare Post: Post;

  @BelongsTo(() => User, "userId")
  declare User: User;

}

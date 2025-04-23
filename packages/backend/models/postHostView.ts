import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";
import { FederatedHost } from "./federatedHost.js";

export interface PostHostViewsAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  federatedHostId: string;
  postId: string;
}

@Table({
  tableName: "postHostViews",
  modelName: "postHostViews",
  timestamps: true
})
export class PostHostView extends Model<PostHostViewsAttributes, PostHostViewsAttributes> implements PostHostViewsAttributes {
  @ForeignKey(() => FederatedHost)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare federatedHostId: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare postId: string;

  @BelongsTo(() => Post, "postId")
  declare post: Post;

  @BelongsTo(() => FederatedHost, "federatedHostId")
  declare federatedHost: FederatedHost;

}

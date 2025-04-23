import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";
import { FederatedHost } from "./federatedHost.js";

export interface PostHostViewsAttributes {
  federatedHostId: string;
  postId: string;
}

@Table({
  tableName: "postHostViews",
  timestamps: true
})
export class PostHostView extends Model<PostHostViewsAttributes, PostHostViewsAttributes> implements PostHostViewsAttributes {
  @ForeignKey(() => FederatedHost)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  federatedHostId!: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  postId!: string;

  @BelongsTo(() => Post, "postId")
  post?: Post;

  @BelongsTo(() => FederatedHost, "federatedHostId")
  federatedHost?: FederatedHost;

}

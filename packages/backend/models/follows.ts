import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface FollowsAttributes {
  remoteFollowId?: string;
  accepted?: boolean;
  bskyUri?: string;
  bskyPath?: string;
  followerId: string;
  followedId: string;
}

@Table({
  tableName: "follows",
  timestamps: true
})
export class Follows extends Model<FollowsAttributes, FollowsAttributes> implements FollowsAttributes {

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  remoteFollowId?: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  accepted?: boolean;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  bskyUri?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  bskyPath?: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  followerId!: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  followedId!: string;

  @BelongsTo(() => User, "followerId")
  follower?: User;

  @BelongsTo(() => User, "followedId")
  followed?: User;
}

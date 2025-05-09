import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface FollowsAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  remoteFollowId?: string;
  accepted?: boolean;
  bskyUri?: string | null;
  bskyPath?: string;
  followerId: string;
  followedId: string;
}

@Table({
  tableName: "follows",
  modelName: "follows",
  timestamps: true
})
export class Follows extends Model<FollowsAttributes, FollowsAttributes> implements FollowsAttributes {

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare remoteFollowId: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare accepted: boolean;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare bskyUri: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare bskyPath: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare followerId: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare followedId: string;

  @BelongsTo(() => User, "followerId")
  declare follower: User;

  @BelongsTo(() => User, "followedId")
  declare followed: User;
}

import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { FederatedHost } from "./federatedHost.js";

export interface ServerBlockAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  userBlockerId?: string;
  blockedServerId?: string;
}

@Table({
  tableName: "serverBlocks",
  modelName: "serverBlocks",
  timestamps: true
})
export class ServerBlock extends Model<ServerBlockAttributes, ServerBlockAttributes> implements ServerBlockAttributes {
  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare userBlockerId: string;

  @ForeignKey(() => FederatedHost)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare blockedServerId: string;

  @BelongsTo(() => User, "userBlockerId")
  declare userBlocker: User;

  @BelongsTo(() => FederatedHost, "blockedServerId")
  declare blockedServer: FederatedHost;

}

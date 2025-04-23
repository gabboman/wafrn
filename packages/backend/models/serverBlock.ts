import {
  Model, Table, Column, DataType, Sequelize, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { FederatedHost } from "./federatedHost.js";

export interface ServerBlockAttributes {
  userBlockerId?: string;
  blockedServerId?: string;
}

@Table({
  tableName: "serverBlocks",
  timestamps: true
})
export class ServerBlock extends Model<ServerBlockAttributes, ServerBlockAttributes> implements ServerBlockAttributes {
  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  userBlockerId?: string;

  @ForeignKey(() => FederatedHost)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  blockedServerId?: string;

  @BelongsTo(() => User, "userBlockerId")
  userBlocker?: User;

  @BelongsTo(() => FederatedHost, "blockedServerId")
  blockedServer?: FederatedHost;

}

import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface BlocksAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  remoteBlockId?: string;
  reason?: string;
  blockedId: string;
  blockerId: string;
}

@Table({
  tableName: "blocks",
  modelName: "blocks",
  timestamps: true
})
export class Blocks extends Model<BlocksAttributes, BlocksAttributes> implements BlocksAttributes {

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare remoteBlockId: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare reason: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare blockedId: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare blockerId: string;

  @BelongsTo(() => User, "blockedId")
  declare blocked: User;

  @BelongsTo(() => User, "blockerId")
  declare blocker: User;
}

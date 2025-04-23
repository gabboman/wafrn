import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface BlocksAttributes {
  remoteBlockId?: string;
  reason?: string;
  blockedId: string;
  blockerId: string;
}

@Table({
  tableName: "blocks",
  timestamps: true
})
export class Blocks extends Model<BlocksAttributes, BlocksAttributes> implements BlocksAttributes {

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  remoteBlockId?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  reason?: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  blockedId!: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  blockerId!: string;

  @BelongsTo(() => User, "blockedId")
  blocked?: User;

  @BelongsTo(() => User, "blockerId")
  blocker?: User;
}

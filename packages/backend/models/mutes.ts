import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface MutesAttributes {
  reason?: string;
  mutedId: string;
  muterId: string;
}

@Table({
  tableName: "mutes",
  timestamps: true
})
export class Mutes extends Model<MutesAttributes, MutesAttributes> implements MutesAttributes {

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
  mutedId!: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  muterId!: string;

  @BelongsTo(() => User, "mutedId")
  muted?: User;

  @BelongsTo(() => User, "muterId")
  muter?: User;
}

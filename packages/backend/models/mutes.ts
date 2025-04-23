import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface MutesAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  reason?: string;
  mutedId: string;
  muterId: string;
}

@Table({
  tableName: "mutes",
  modelName: "mutes",
  timestamps: true
})
export class Mutes extends Model<MutesAttributes, MutesAttributes> implements MutesAttributes {

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
  declare mutedId: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare muterId: string;

  @BelongsTo(() => User, "mutedId")
  declare muted: User;

  @BelongsTo(() => User, "muterId")
  declare muter: User;
}

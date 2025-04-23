import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface MfaDetailsAttributes {
  userId: string;
  type?: string;
  name?: string;
  data?: object;
  lastUsedData?: object;
  enabled?: boolean;
}

@Table({
  tableName: "mfaDetails",
  timestamps: true
})
export class MfaDetails extends Model<MfaDetailsAttributes, MfaDetailsAttributes> implements MfaDetailsAttributes {

  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  userId!: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  type?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  name?: string;

  @Column({
    allowNull: true,
    type: DataType.JSON
  })
  data?: object;

  @Column({
    allowNull: true,
    type: DataType.JSON
  })
  lastUsedData?: object;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  enabled?: boolean;

  @BelongsTo(() => User, "userId")
  user?: User;
}

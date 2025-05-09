import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface MfaDetailsAttributes {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
  type?: string;
  name?: string;
  data?: object;
  lastUsedData?: object;
  enabled?: boolean;
}

@Table({
  tableName: "mfaDetails",
  modelName: "mfaDetails",
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
  declare userId: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare type: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare name: string;

  @Column({
    allowNull: true,
    type: DataType.JSON
  })
  declare data: object;

  @Column({
    allowNull: true,
    type: DataType.JSON
  })
  declare lastUsedData: object;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  declare enabled: boolean;

  @BelongsTo(() => User, "userId")
  declare user: User;
}

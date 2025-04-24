import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface UserOptionsAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
  optionName: string;
  optionValue?: string;
  public?: boolean;
}

@Table({
  tableName: "userOptions",
  modelName: "userOptions",
  timestamps: true
})
export class UserOptions extends Model<UserOptionsAttributes, UserOptionsAttributes> implements UserOptionsAttributes {

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare userId: string;

  @Column({
    primaryKey: true,
    type: DataType.STRING(255)
  })
  declare optionName: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare optionValue: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare public: boolean;

  @BelongsTo(() => User)
  declare user: User;

}

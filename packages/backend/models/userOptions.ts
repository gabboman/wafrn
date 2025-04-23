import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface UserOptionsAttributes {
  userId: string;
  optionName: string;
  optionValue?: string;
  public?: boolean;
}

@Table({
  tableName: "userOptions",
  timestamps: true
})
export class UserOptions extends Model<UserOptionsAttributes, UserOptionsAttributes> implements UserOptionsAttributes {

  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  userId!: string;

  @Column({
    primaryKey: true,
    type: DataType.STRING(255)
  })
  optionName!: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  optionValue?: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  public?: boolean;

  @BelongsTo(() => User)
  user?: User;

}

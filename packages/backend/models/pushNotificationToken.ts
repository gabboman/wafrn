import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface PushNotificationTokenAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  token: string;
  userId: string;
}

@Table({
  tableName: "pushNotificationTokens",
  modelName: "pushNotificationTokens",
  timestamps: true
})
export class PushNotificationToken extends Model<PushNotificationTokenAttributes, PushNotificationTokenAttributes> implements PushNotificationTokenAttributes {

  @Column({
    primaryKey: true,
    type: DataType.STRING(768)
  })
  declare token: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID
  })
  declare userId: string;

  @BelongsTo(() => User, "userId")
  declare user: User;
}

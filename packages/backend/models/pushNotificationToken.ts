import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface PushNotificationTokenAttributes {
  token: string;
  userId: string;
}

@Table({
  tableName: "pushNotificationTokens",
  timestamps: true
})
export class PushNotificationToken extends Model<PushNotificationTokenAttributes, PushNotificationTokenAttributes> implements PushNotificationTokenAttributes {

  @Column({
    primaryKey: true,
    type: DataType.STRING(768)
  })
  token!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID
  })
  userId!: string;

  @BelongsTo(() => User, "userId")
  user?: User;
}

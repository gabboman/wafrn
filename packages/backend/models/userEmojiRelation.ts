import {
  Model, Table, Column, DataType, ForeignKey
} from "sequelize-typescript";
import { Emoji } from "./emoji.js";
import { User } from "./user.js";

export interface UserEmojiRelationAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
  emojiId: string;
}

@Table({
  tableName: "userEmojiRelations",
  modelName: "userEmojiRelations",
  timestamps: true
})
export class UserEmojiRelation extends Model<UserEmojiRelationAttributes, UserEmojiRelationAttributes> implements UserEmojiRelationAttributes {
  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare userId: string;

  @ForeignKey(() => Emoji)
  @Column({
    primaryKey: true,
    type: DataType.STRING(255)
  })
  declare emojiId: string;
}

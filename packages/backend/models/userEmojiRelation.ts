import {
  Model, Table, Column, DataType, Index, Sequelize, ForeignKey
} from "sequelize-typescript";

export interface UserEmojiRelationAttributes {
  userId: string;
  emojiId: string;
}

@Table({
  tableName: "userEmojiRelations",
  timestamps: true
})
export class UserEmojiRelation extends Model<UserEmojiRelationAttributes, UserEmojiRelationAttributes> implements UserEmojiRelationAttributes {
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  userId!: string;

  @Column({
    primaryKey: true,
    type: DataType.STRING(255)
  })
  emojiId!: string;
}

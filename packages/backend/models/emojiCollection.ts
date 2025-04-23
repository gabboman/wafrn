import {
  Model, Table, Column, DataType, HasMany
} from "sequelize-typescript";
import { Emoji } from "./emoji.js";

export interface EmojiCollectionAttributes {
  name?: string;
  comment?: string;
}

@Table({
  tableName: "emojiCollections",
  timestamps: true
})
export class EmojiCollection extends Model<EmojiCollectionAttributes, EmojiCollectionAttributes> implements EmojiCollectionAttributes {

  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare id: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  name?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  comment?: string;

  @HasMany(() => Emoji)
  emojis?: Emoji[];
}

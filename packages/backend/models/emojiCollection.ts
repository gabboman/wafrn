import {
  Model, Table, Column, DataType, HasMany
} from "sequelize-typescript";
import { Emoji } from "./emoji.js";

export interface EmojiCollectionAttributes {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  name?: string;
  comment?: string;
}

@Table({
  tableName: "emojiCollections",
  modelName: "emojiCollections",
  timestamps: true
})
export class EmojiCollection extends Model<EmojiCollectionAttributes, EmojiCollectionAttributes> implements EmojiCollectionAttributes {

  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  declare id: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare name: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare comment: string;

  @HasMany(() => Emoji)
  declare emojis: Emoji[];
}

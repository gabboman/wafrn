import {
  Model, Table, Column, DataType, Index, Sequelize, ForeignKey
} from "sequelize-typescript";
import { Emoji } from "./emoji.js";
import { Post } from "./post.js";

export interface PostEmojiRelationsAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  postId: string;
  emojiId: string;
}

@Table({
  tableName: "postEmojiRelations",
  modelName: "postEmojiRelations",
  timestamps: true
})
export class PostEmojiRelations extends Model<PostEmojiRelationsAttributes, PostEmojiRelationsAttributes> implements PostEmojiRelationsAttributes {
  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare postId: string;

  @ForeignKey(() => Emoji)
  @Column({
    primaryKey: true,
    type: DataType.STRING(255)
  })
  declare emojiId: string;
}

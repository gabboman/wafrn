import { Model, Table, Column, DataType, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import { Emoji } from "./emoji.js";
import { User } from "./user.js";
import { Post } from "./post.js";
import { Notification } from "./notification.js";
import { defaultValueSchemable } from "sequelize/lib/utils";

export interface EmojiReactionAttributes {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  remoteId?: string;
  content?: string;
  postId?: string;
  userId?: string;
  emojiId?: string;
}

@Table({
  tableName: "emojiReactions",
  modelName: "emojiReactions",
  timestamps: true
})
export class EmojiReaction extends Model<EmojiReactionAttributes, EmojiReactionAttributes> implements EmojiReactionAttributes {

  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  declare id: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  declare remoteId: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare content: string;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare postId: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare userId: string;

  @ForeignKey(() => Emoji)
  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare emojiId: string;

  @BelongsTo(() => Post, "postId")
  declare post: Post

  @BelongsTo(() => User, "userId")
  declare user: Post

  @BelongsTo(() => Emoji, "emojiId")
  declare emoji: Post

  @HasMany(() => Notification)
  declare notifications: Notification[];
}

import { Model, Table, Column, DataType, ForeignKey, BelongsTo } from "sequelize-typescript";
import { Emoji } from "./emoji.js";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface EmojiReactionAttributes {
  remoteId?: string;
  content?: string;
  postId?: string;
  userId?: string;
  emojiId?: string;
}

@Table({
  tableName: "emojiReactions",
  timestamps: true
})
export class EmojiReaction extends Model<EmojiReactionAttributes, EmojiReactionAttributes> implements EmojiReactionAttributes {

  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare id: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(768)
  })
  remoteId?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  content?: string;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  postId?: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  userId?: string;

  @ForeignKey(() => Emoji)
  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  emojiId?: string;

  @BelongsTo(() => Post, "postId")
  post?: Post

  @BelongsTo(() => User, "userId")
  user?: Post

  @BelongsTo(() => Emoji, "emojiId")
  emoji?: Post
}

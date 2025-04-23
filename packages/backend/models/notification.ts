import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";
import { EmojiReaction } from "./emojiReaction.js";

export interface NotificationAttributes {
  notificationType?: string;
  notifiedUserId?: string;
  userId?: string;
  postId?: string;
  emojiReactionId?: string;
}

@Table({
  tableName: "notifications",
  timestamps: true
})
export class Notification extends Model<NotificationAttributes, NotificationAttributes> implements NotificationAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING(128)
  })
  notificationType?: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  notifiedUserId?: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  userId?: string;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  postId?: string;

  @ForeignKey(() => EmojiReaction)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  emojiReactionId?: string;

  @BelongsTo(() => User, "userId")
  user?: User;

  @BelongsTo(() => User, "notifiedUserId")
  notifiedUser?: User;

  @BelongsTo(() => Post, "postId")
  post?: Post;

  @BelongsTo(() => EmojiReaction, "emojiReactionId")
  emojiReacion?: EmojiReaction;
}

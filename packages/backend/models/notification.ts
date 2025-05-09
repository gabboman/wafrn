import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";
import { EmojiReaction } from "./emojiReaction.js";

export interface NotificationAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  notificationType?: string;
  notifiedUserId?: string;
  userId?: string;
  postId?: string | null;
  emojiReactionId?: string;
}

@Table({
  tableName: "notifications",
  modelName: "notifications",
  timestamps: true
})
export class Notification extends Model<NotificationAttributes, NotificationAttributes> implements NotificationAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING(128)
  })
  declare notificationType: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare notifiedUserId: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare userId: string;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare postId: string | null;

  @ForeignKey(() => EmojiReaction)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare emojiReactionId: string;

  @BelongsTo(() => User, "userId")
  declare user: User;

  @BelongsTo(() => User, "notifiedUserId")
  declare notifiedUser: User;

  @BelongsTo(() => Post, "postId")
  declare post: Post;

  @BelongsTo(() => EmojiReaction, "emojiReactionId")
  declare emojiReaction: EmojiReaction;
}

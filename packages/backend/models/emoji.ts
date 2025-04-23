import {
  Model, Table, Column, DataType, ForeignKey, HasMany, BelongsToMany, BelongsTo
} from "sequelize-typescript";
import { EmojiReaction } from "./emojiReaction.js";
import { User } from "./user.js";
import { UserEmojiRelation } from "./userEmojiRelation.js";
import { Post } from "./post.js";
import { PostEmojiRelations } from "./postEmojiRelations.js";
import { EmojiCollection } from "./emojiCollection.js";
import { Notification } from "./notification.js";

export interface EmojiAttributes {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  name?: string;
  url?: string;
  external?: boolean;
  emojiCollectionId?: string;
}

@Table({
  tableName: "emojis",
  modelName: "emojis",
  timestamps: true
})
export class Emoji extends Model<EmojiAttributes, EmojiAttributes> implements EmojiAttributes {

  @Column({
    primaryKey: true,
    type: DataType.STRING(255)
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
  declare url: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  declare external: boolean;

  @ForeignKey(() => EmojiCollection)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare emojiCollectionId: string;

  @HasMany(() => EmojiReaction)
  declare emojiReactions: EmojiReaction[];

  @BelongsToMany(() => User, () => UserEmojiRelation)
  declare users: User[];

  @BelongsToMany(() => Post, () => PostEmojiRelations)
  declare posts: Post[];

  @BelongsTo(() => EmojiCollection, "emojiCollectionId")
  declare emojiCollection: EmojiCollection;
}

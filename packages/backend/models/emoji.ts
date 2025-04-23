import {
  Model, Table, Column, DataType, ForeignKey, HasMany, BelongsToMany, BelongsTo
} from "sequelize-typescript";
import { EmojiReaction } from "./emojiReaction.js";
import { User } from "./user.js";
import { UserEmojiRelations } from "./userEmojiRelation.js";
import { Post } from "./post.js";
import { PostEmojiRelations } from "./postEmojiRelations.js";
import { EmojiCollection } from "./emojiCollection.js";

export interface EmojiAttributes {
  name?: string;
  url?: string;
  external?: boolean;
  emojiCollectionId?: string;
}

@Table({
  tableName: "emojis",
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
  name?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  url?: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  external?: boolean;

  @ForeignKey(() => EmojiCollection)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  emojiCollectionId?: string;

  @HasMany(() => EmojiReaction)
  emojiReactions?: EmojiReaction[];

  @BelongsToMany(() => User, () => UserEmojiRelations)
  users?: User[];

  @BelongsToMany(() => Post, () => PostEmojiRelations)
  posts?: Post[];

  @BelongsTo(() => EmojiCollection, "emojiCollectionId")
  emojiCollection?: EmojiCollection;
}

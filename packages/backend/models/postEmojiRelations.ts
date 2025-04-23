import {
  Model, Table, Column, DataType, Index, Sequelize, ForeignKey
} from "sequelize-typescript";

export interface PostEmojiRelationsAttributes {
  postId: string;
  emojiId: string;
}

@Table({
  tableName: "postEmojiRelations",
  timestamps: true
})
export class PostEmojiRelations extends Model<PostEmojiRelationsAttributes, PostEmojiRelationsAttributes> implements PostEmojiRelationsAttributes {
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  postId!: string;

  @Column({
    primaryKey: true,
    type: DataType.STRING(255)
  })
  emojiId!: string;
}

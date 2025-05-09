import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface PostMentionsUserRelationAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  userId: string;
  postId: string;
}

@Table({
  tableName: "postMentionsUserRelations",
  modelName: "postMentionsUserRelations",
  timestamps: true
})
export class PostMentionsUserRelation extends Model<PostMentionsUserRelationAttributes, PostMentionsUserRelationAttributes> implements PostMentionsUserRelationAttributes {
  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare userId: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare postId: string;

  @BelongsTo(() => User, "userId")
  declare user: User;

  @BelongsTo(() => Post, "postId")
  declare post: Post;
}

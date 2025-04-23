import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface PostMentionsUserRelationAttributes {
  userId: string;
  postId: string;
}

@Table({
  tableName: "postMentionsUserRelations",
  timestamps: true
})
export class PostMentionsUserRelation extends Model<PostMentionsUserRelationAttributes, PostMentionsUserRelationAttributes> implements PostMentionsUserRelationAttributes {
  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  userId!: string;

  @ForeignKey(() => Post)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  postId!: string;

  @BelongsTo(() => User, "userId")
  user?: User;

  @BelongsTo(() => Post, "postId")
  post?: Post;
}

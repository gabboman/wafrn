import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface PostReportAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  resolved?: boolean;
  severity?: number;
  description?: string;
  userId?: string;
  postId?: string;
}

@Table({
  tableName: "postReports",
  modelName: "postReports",
  timestamps: true
})
export class PostReport extends Model<PostReportAttributes, PostReportAttributes> implements PostReportAttributes {
  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  declare resolved: boolean;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  declare severity: number;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare description: string;

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
  declare postId: string;

  @BelongsTo(() => User, "userId")
  declare user: User;

  @BelongsTo(() => Post, "postId")
  declare post: Post;

}

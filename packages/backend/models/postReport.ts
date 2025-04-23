import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface PostReportAttributes {
  resolved?: boolean;
  severity?: number;
  description?: string;
  userId?: string;
  postId?: string;
}

@Table({
  tableName: "postReports",
  timestamps: true
})
export class PostReport extends Model<PostReportAttributes, PostReportAttributes> implements PostReportAttributes {
  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  resolved?: boolean;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  severity?: number;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  description?: string;

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

  @BelongsTo(() => User, "userId")
  user?: User;

  @BelongsTo(() => Post, "postId")
  post?: Post;

}

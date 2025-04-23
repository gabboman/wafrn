import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";
import { User } from "./user.js";

export interface AskAttributes {
  question?: string;
  apObject?: string;
  creationIp?: string;
  answered?: boolean;
  postId?: string;
  userAsked?: string;
  userAsker?: string;
}

@Table({
  tableName: "asks",
  timestamps: true
})
export class Ask extends Model<AskAttributes, AskAttributes> implements AskAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  question?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  apObject?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  creationIp?: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  answered?: boolean;

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
  userAsked?: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  userAsker?: string;

  @BelongsTo(() => Post, "postId")
  post?: Post;

  @BelongsTo(() => User, "userAsked")
  userAskedUser?: User;

  @BelongsTo(() => User, "userAsker")
  userAskerUser?: User;
}

import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { Post } from "./post.js";
import { User } from "./user.js";

export interface AskAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  question?: string;
  apObject?: string | null;
  creationIp?: string;
  answered?: boolean;
  postId?: string | null;
  userAsked?: string;
  userAsker?: string;
}

@Table({
  tableName: "asks",
  modelName: "asks",
  timestamps: true
})
export class Ask extends Model<AskAttributes, AskAttributes> implements AskAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare question: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare apObject: string | null;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare creationIp: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  declare answered: boolean;

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare postId: string | null;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare userAsked: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare userAsker: string;

  @BelongsTo(() => Post, "postId")
  declare post: Post;

  @BelongsTo(() => User, "userAsked")
  declare userAskedUser: User;

  @BelongsTo(() => User, "userAsker")
  declare userAskerUser: User;
}

import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";
import { Post } from "./post.js";

export interface MediaAttributes {
  mediaOrder?: number;
  nsfw?: boolean;
  description?: string;
  url?: string;
  ipUpload?: string;
  external?: boolean;
  mediaType?: string;
  width?: number;
  height?: number;
  blurhash?: string;
  userId?: string;
  postId?: string;
}

@Table({
  tableName: "medias",
  timestamps: true
})
export class Media extends Model<MediaAttributes, MediaAttributes> implements MediaAttributes {
  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  mediaOrder?: number;

  @Column({
    field: "NSFW",
    allowNull: true,
    type: DataType.BOOLEAN
  })
  nsfw?: boolean;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  description?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  url?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  ipUpload?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  external?: boolean;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  mediaType?: string;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  width?: number;

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  height?: number;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  blurhash?: string;

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

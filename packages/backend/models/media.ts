import { Model, Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript'
import { User } from './user.js'
import { Post } from './post.js'
import { completeEnvironment } from '../utils/backendOptions.js'

export interface MediaAttributes {
  id?: number
  createdAt?: Date
  updatedAt?: Date
  mediaOrder?: number
  NSFW?: boolean
  description?: string
  url?: string
  ipUpload?: string
  external?: boolean
  mediaType?: string | null
  width?: number
  height?: number
  blurhash?: string
  userId?: string
  postId?: string
}

@Table({
  tableName: 'medias',
  modelName: 'medias',
  timestamps: true
})
export class Media extends Model<MediaAttributes, MediaAttributes> implements MediaAttributes {
  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  declare mediaOrder: number

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  declare NSFW: boolean

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare description: string

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare url: string

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare ipUpload: string

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare external: boolean

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare mediaType: string | null

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  declare width: number

  @Column({
    allowNull: true,
    type: DataType.INTEGER,
    defaultValue: 0
  })
  declare height: number

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare blurhash: string

  @ForeignKey(() => User)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare userId: string

  @ForeignKey(() => Post)
  @Column({
    allowNull: true,
    type: DataType.UUID
  })
  declare postId: string

  @BelongsTo(() => User, 'userId')
  declare user: User

  @BelongsTo(() => Post, 'postId')
  declare post: Post

  get fullUrl(): string {
    return this.url.startsWith('?cid')
      ? completeEnvironment.externalCacheurl + this.url
      : this.external
      ? this.url
      : completeEnvironment.mediaUrl + this.url
  }
}

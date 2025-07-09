import { Model, Table, Column, DataType, ForeignKey, BelongsTo, PrimaryKey } from 'sequelize-typescript'
import { User } from './user.js'

export interface UserFollowHashtagsAttributes {
  userId: string
  tagName: string
  createdAt?: Date
  updatedAt?: Date
}

@Table({
  tableName: 'userFollowHashtags',
  modelName: 'userFollowHashtags',
  timestamps: true
})
export class UserFollowHashtags
  extends Model<UserFollowHashtagsAttributes, UserFollowHashtagsAttributes>
  implements UserFollowHashtagsAttributes
{
  @ForeignKey(() => User)
  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare userId: string

  @Column({
    primaryKey: true,
    type: DataType.STRING(256)
  })
  declare tagName: string

  @Column({
    type: DataType.DATE,
    defaultValue: new Date()
  })
  declare createdAt: Date

  @Column({
    type: DataType.DATE,
    defaultValue: new Date()
  })
  declare editedAt: Date

  @BelongsTo(() => User, 'userId')
  declare user: User
}

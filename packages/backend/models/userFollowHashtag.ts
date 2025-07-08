import { Model, Table, Column, DataType, ForeignKey, BelongsTo, PrimaryKey } from 'sequelize-typescript'
import { User } from './user.js'

export interface UserFollowHashtagAttributes {
  userId: string
  tagName: string
  createdAt: Date
  updatedAt: Date
}

@Table({
  tableName: 'UserFollowHashtags',
  modelName: 'UserFollowHashtags',
  timestamps: true
})
export class UserFollowHashtag
  extends Model<UserFollowHashtagAttributes, UserFollowHashtagAttributes>
  implements UserFollowHashtagAttributes
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

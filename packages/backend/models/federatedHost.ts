import { Model, Table, Column, DataType, HasMany, BelongsToMany } from 'sequelize-typescript'
import { User } from './user.js'
import { Post } from './post.js'
import { PostHostView } from './postHostView.js'
import { ServerBlock } from './serverBlock.js'

export interface FederatedHostAttributes {
  id?: string
  createdAt?: Date
  updatedAt?: Date
  displayName?: string
  publicInbox?: string | null
  publicKey?: string
  detail?: string
  blocked?: boolean
  friendServer?: boolean
  bubbleTimeline?: boolean
}

@Table({
  tableName: 'federatedHosts',
  modelName: 'federatedHosts',
  timestamps: true
})
export class FederatedHost
  extends Model<FederatedHostAttributes, FederatedHostAttributes>
  implements FederatedHostAttributes
{
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  declare id: string

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare displayName: string

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare publicInbox: string | null

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare publicKey: string

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare detail: string

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare blocked: boolean

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare friendServer: boolean

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare bubbleTimeline: boolean

  @HasMany(() => User)
  declare users: User[]

  @BelongsToMany(() => Post, () => PostHostView)
  declare postView: Post[]

  @HasMany(() => ServerBlock)
  declare blockedServer: ServerBlock[]
}

import { Model, DataType, Column, Table } from "sequelize-typescript"

export interface UnifiedPushDataAttributes {
  id: string // UUID
  createdAt?: Date
  updatedAt?: Date
  userId: string // UUID
  endpoint: string
  deviceAuth: string
  devicePublicKey: string
}

@Table({
  tableName: "unifiedPushData",
  modelName: "unifiedPushData",
  timestamps: true
})
export class UnifiedPushData extends Model<UnifiedPushDataAttributes, Partial<UnifiedPushDataAttributes>> implements UnifiedPushDataAttributes {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4
  })
  declare id: string

  @Column({
    type: DataType.UUID,
    allowNull: false
  })
  declare userId: string

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare endpoint: string

  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare deviceAuth: string
  
  @Column({
    type: DataType.STRING,
    allowNull: false
  })
  declare devicePublicKey: string
}

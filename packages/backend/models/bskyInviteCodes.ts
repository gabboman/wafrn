import { Model, Table, Column, DataType } from 'sequelize-typescript'

export interface BskyInviteCodesAttributes {
  id?: number
  code?: string
  masterCode?: boolean
}

@Table({
  tableName: 'bskyInviteCodes',
  modelName: 'bskyInviteCodes',
  timestamps: true
})
export class BskyInviteCodes
  extends Model<BskyInviteCodesAttributes, BskyInviteCodesAttributes>
  implements BskyInviteCodesAttributes
{
  @Column({
    allowNull: true,
    type: DataType.STRING(512)
  })
  declare code: string

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare masterCode: boolean
}

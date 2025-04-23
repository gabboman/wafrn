import {
  Model, Table, Column, DataType
} from "sequelize-typescript";

export interface BskyInviteCodesAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  code?: string;
}

@Table({
  tableName: "bskyInviteCodes",
  modelName: "bskyInviteCodes",
  timestamps: true
})
export class BskyInviteCodes extends Model<BskyInviteCodesAttributes, BskyInviteCodesAttributes> implements BskyInviteCodesAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING(512)
  })
  declare code: string;
}

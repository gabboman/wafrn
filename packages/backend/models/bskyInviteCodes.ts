import {
  Model, Table, Column, DataType
} from "sequelize-typescript";

export interface BskyInviteCodesAttributes {
  code?: string;
}

@Table({
  tableName: "bskyInviteCodes",
  timestamps: true
})
export class BskyInviteCodes extends Model<BskyInviteCodesAttributes, BskyInviteCodesAttributes> implements BskyInviteCodesAttributes {
  @Column({
    allowNull: true,
    type: DataType.STRING(512)
  })
  code?: string;
}

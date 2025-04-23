import {
  Model, Table, Column, DataType
} from "sequelize-typescript";

export interface FederatedHostAttributes {
  displayName?: string;
  publicInbox?: string;
  publicKey?: string;
  detail?: string;
  blocked?: boolean;
  friendServer?: boolean;
}

@Table({
  tableName: "federatedHosts",
  timestamps: true
})
export class FederatedHost extends Model<FederatedHostAttributes, FederatedHostAttributes> implements FederatedHostAttributes {

  @Column({
    primaryKey: true,
    type: DataType.UUID
  })
  declare id: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  displayName?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  publicInbox?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  publicKey?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  detail?: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  blocked?: boolean;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  friendServer?: boolean;
}

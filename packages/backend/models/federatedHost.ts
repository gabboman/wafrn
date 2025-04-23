import {
  Model, Table, Column, DataType
} from "sequelize-typescript";

export interface FederatedHostAttributes {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4
  })
  declare id: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare displayName: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare publicInbox: string;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare publicKey: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(255)
  })
  declare detail: string;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare blocked: boolean;

  @Column({
    allowNull: true,
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  declare friendServer: boolean;
}

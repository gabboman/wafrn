import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface UserReportAttributes {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
  resolved?: boolean;
  severity?: number;
  description?: string;
  reporterId?: string;
  reportedId?: string;
}

@Table({
  tableName: "userReports",
  modelName: "userReports",
  timestamps: true
})
export class UserReport extends Model<UserReportAttributes, UserReportAttributes> implements UserReportAttributes {
  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  declare resolved: boolean;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  declare severity: number;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  declare description: string;

  @ForeignKey(() => User)
  @Column({
    field: "ReporterId",
    allowNull: true,
    type: DataType.UUID
  })
  declare reporterId: string;

  @ForeignKey(() => User)
  @Column({
    field: "ReportedId",
    allowNull: true,
    type: DataType.UUID
  })
  declare reportedId: string;

  @BelongsTo(() => User, "ReporterId")
  declare reporter: User;

  @BelongsTo(() => User, "ReportedId")
  declare reported: User;
}

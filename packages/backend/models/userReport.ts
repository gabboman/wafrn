import {
  Model, Table, Column, DataType, ForeignKey, BelongsTo
} from "sequelize-typescript";
import { User } from "./user.js";

export interface UserReportAttributes {
  resolved?: boolean;
  severity?: number;
  description?: string;
  reporterId?: string;
  reportedId?: string;
}

@Table({
  tableName: "userReports",
  timestamps: true
})
export class UserReport extends Model<UserReportAttributes, UserReportAttributes> implements UserReportAttributes {
  @Column({
    allowNull: true,
    type: DataType.BOOLEAN
  })
  resolved?: boolean;

  @Column({
    allowNull: true,
    type: DataType.INTEGER
  })
  severity?: number;

  @Column({
    allowNull: true,
    type: DataType.STRING
  })
  description?: string;

  @ForeignKey(() => User)
  @Column({
    field: "ReporterId",
    allowNull: true,
    type: DataType.UUID
  })
  reporterId?: string;

  @ForeignKey(() => User)
  @Column({
    field: "ReportedId",
    allowNull: true,
    type: DataType.UUID
  })
  reportedId?: string;

  @BelongsTo(() => User, "ReporterId")
  reporter?: User;

  @BelongsTo(() => User, "ReportedId")
  reported?: User;
}

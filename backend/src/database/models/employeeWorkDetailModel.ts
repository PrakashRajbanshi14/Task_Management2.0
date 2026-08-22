import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";

import {
  EmployeeWorkDetailAttributes,
} from "../types/types";

import {
  SalaryStatus,
} from "../../globals/types";


interface EmployeeWorkDetailCreationAttributes
  extends Omit<
    EmployeeWorkDetailAttributes,
    "id"
  > {

  id?: string;

}


@Table({
  tableName: "employee_work_details",
  modelName: "EmployeeWorkDetail",
  timestamps: true,
})
class EmployeeWorkDetail extends Model<
  EmployeeWorkDetailAttributes,
  EmployeeWorkDetailCreationAttributes
> {


  // ==========================================
  // ID
  // ==========================================

  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;


  // ==========================================
  // EMPLOYEE ID
  // ==========================================

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare employeeId: string;


  // ==========================================
  // MONTH
  // ==========================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare month: number;


  // ==========================================
  // YEAR
  // ==========================================

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare year: number;


  // ==========================================
  // TOTAL VIDEO LENGTH
  //
  // Store seconds
  //
  // Example:
  // 3600 = 1 hour
  // ==========================================

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: 0,
  })
  declare totalVideoLength: number;


  // ==========================================
  // SALARY STATUS
  // ==========================================

  @Column({
    type: DataType.ENUM(
      SalaryStatus.Paid,
      SalaryStatus.Unpaid,
    ),
    allowNull: false,
    defaultValue: SalaryStatus.Unpaid,
  })
  declare salaryStatus: SalaryStatus;


  // ==========================================
  // SALARY AMOUNT
  // ==========================================

  @Column({
    type: DataType.DECIMAL(12, 2),
    allowNull: true,
  })
  declare salaryAmount: number | null;


  // ==========================================
  // NOTES
  // ==========================================

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare notes: string | null;

}


export default EmployeeWorkDetail;
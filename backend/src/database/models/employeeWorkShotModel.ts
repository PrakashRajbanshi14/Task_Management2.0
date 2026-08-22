import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";

import {
  EmployeeWorkShotAttributes,
} from "../types/types";


interface EmployeeWorkShotCreationAttributes
  extends Omit<
    EmployeeWorkShotAttributes,
    "id"
  > {

  id?: string;

}


@Table({
  tableName: "employee_work_shots",
  modelName: "EmployeeWorkShot",
  timestamps: true,
})
class EmployeeWorkShot extends Model<
  EmployeeWorkShotAttributes,
  EmployeeWorkShotCreationAttributes
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
  // WORK DETAIL ID
  // ==========================================

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare workDetailId: string;


  // ==========================================
  // PROJECT ID
  // ==========================================

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare projectId: string;


  // ==========================================
  // SHOT ID
  // ==========================================

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare shotId: string;

  // ==========================================
  // VIDEO LENGTH
  //
  // Store seconds
  // ==========================================

  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    defaultValue: 0,
  })
  declare videoLength: number;

}


export default EmployeeWorkShot;
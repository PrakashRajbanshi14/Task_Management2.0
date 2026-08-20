import { Table, Column, Model, DataType } from "sequelize-typescript";
import { EmployeeAttributes } from "../types/types";
import { ProjectPriority, ProjectStatus } from "../../globals/types";

interface EmployeeCreationAttributes extends Omit<
  EmployeeAttributes,
  "id" 
> {
  id?: string;
}

@Table({
  tableName: "employees",
  modelName: "Employee",
  timestamps: true,
})
class Employee extends Model<EmployeeAttributes, EmployeeCreationAttributes> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.UUID,
  })
  declare userId: string;

  @Column({
    type: DataType.STRING,
  })
  declare fullname: string;

  @Column({
    type: DataType.STRING,
  })
  declare contact: string;

  @Column({
    type: DataType.STRING,
  })
  declare address: string;

  @Column({
    type: DataType.STRING,
  })
  declare employeeCode: string;

  @Column({
    type: DataType.STRING,
  })
  declare jobTitle: string;

  @Column({
    type: DataType.BOOLEAN,
  })
  declare hasWork: boolean;
}

export default Employee;

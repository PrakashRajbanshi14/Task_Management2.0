import { Table, Column, Model, DataType } from "sequelize-typescript";
import { ProjectAssignedAttributes } from "../types/types";

interface ProjectAssignedCreationAttributes extends Omit<
  ProjectAssignedAttributes,
  "id"
> {
  id?: string;
}

@Table({
  tableName: "project_assigned",
  modelName: "ProjectAssigned",
  timestamps: true,
})
class ProjectAssigned extends Model<
  ProjectAssignedAttributes,
  ProjectAssignedCreationAttributes
> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.UUID,
  })
  declare projectId: string;

  @Column({
    type: DataType.UUID,
  })
  declare employeeId: string;

  @Column({
    type: DataType.UUID,
  })
  declare assignedBy: string;
}

export default ProjectAssigned;

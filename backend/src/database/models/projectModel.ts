import { Table, Column, Model, DataType } from "sequelize-typescript";
import { ProjectAttributes } from "../types/types";
import { ProjectPriority, ProjectStatus } from "../../globals/types";

interface ProjectCreationAttributes extends Omit<
  ProjectAttributes,
  "id" | "status" | "priority"
> {
  id?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
}

@Table({
  tableName: "projects",
  modelName: "Project",
  timestamps: true,
})
class Project extends Model<ProjectAttributes, ProjectCreationAttributes> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.UUID,
  })
  declare projectManagerId: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare startDate: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare endDate: Date | null;

  @Column({
    type: DataType.STRING,
    defaultValue: ProjectStatus.planned,
    validate: {
      isIn: [Object.values(ProjectStatus)],
    },
  })
  declare status: ProjectStatus;

  @Column({
    type: DataType.STRING,
    defaultValue: ProjectPriority.medium,
    validate: {
      isIn: [Object.values(ProjectPriority)],
    },
  })
  declare priority: ProjectPriority;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare googleDriveFolderId: string | null;
}

export default Project;

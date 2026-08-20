import { Table, Column, Model, DataType } from "sequelize-typescript";
import { ProjectShotAttributes } from "../types/types";
import { ShotStatus } from "../../globals/types";

interface ProjectShotCreationAttributes extends Omit<
  ProjectShotAttributes,
  "id" | "status"
> {
  id?: string;
  status?: ShotStatus;
}

@Table({
  tableName: "project_shots",
  modelName: "ProjectShot",
  timestamps: true,
})
class ProjectShot extends Model<
  ProjectShotAttributes,
  ProjectShotCreationAttributes
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
    type: DataType.STRING,
    allowNull: true,
  })
  declare googleDriveFolderId: string | null;

  @Column({
    type: DataType.INTEGER,
  })
  declare shotNumber: number;

  @Column({
    type: DataType.STRING,
  })
  declare title: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare underReviewFolderId: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare finalVideoFolderId: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare projectFilesFolderId: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare script: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare deadline: Date | null;

  @Column({
    type: DataType.STRING,
    defaultValue: ShotStatus.created,
    validate: {
      isIn: [Object.values(ShotStatus)],
    },
  })
  declare status: ShotStatus;

  @Column({
    type: DataType.UUID,
  })
  declare createdBy: string;
}

export default ProjectShot;

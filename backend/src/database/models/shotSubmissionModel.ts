import { Table, Column, Model, DataType } from "sequelize-typescript";
import { ShotSubmissionAttributes } from "../types/types";
import { SubmissionFileType, SubmissionStatus } from "../../globals/types";

interface ShotSubmissionCreationAttributes extends Omit<
  ShotSubmissionAttributes,
  "id" | "status"
> {
  id?: string;
  status?: SubmissionStatus;
}

@Table({
  tableName: "shot_submissions",
  modelName: "ShotSubmission",
  timestamps: true,
})
class ShotSubmission extends Model<
  ShotSubmissionAttributes,
  ShotSubmissionCreationAttributes
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
  declare shotId: string;

  @Column({
    type: DataType.UUID,
  })
  declare submittedBy: string;

  @Column({
    type: DataType.INTEGER,
  })
  declare version: number;

  @Column({
    type: DataType.STRING,
  })
  declare driveFileId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare driveFileUrl: string | null;

  @Column({
    type: DataType.STRING,
  })
  declare fileName: string;

  @Column({
    type: DataType.BIGINT,
    allowNull: true,
  })
  declare fileSize: number | null;

  @Column({
  type: DataType.ENUM(
    SubmissionFileType.video,
    SubmissionFileType.projectFiles
  ),
  allowNull: false,
})
declare fileType: SubmissionFileType;


  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare mimeType: string | null;

  @Column({
    type: DataType.STRING,
    defaultValue: SubmissionStatus.submitted,
    validate: {
      isIn: [Object.values(SubmissionStatus)],
    },
  })
  declare status: SubmissionStatus;

}

export default ShotSubmission;

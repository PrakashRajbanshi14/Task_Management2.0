import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";

import {
  SubmissionFileAttributes,
} from "../types/types";

import {
  SubmissionFileType,
} from "../../globals/types";


interface SubmissionFileCreationAttributes
  extends Omit<
    SubmissionFileAttributes,
    "id"
  > {

  id?: string;
}


@Table({
  tableName: "submission_files",

  modelName: "SubmissionFile",

  timestamps: true,
})
class SubmissionFile extends Model<
  SubmissionFileAttributes,
  SubmissionFileCreationAttributes
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
  // SUBMISSION ID
  // ==========================================

  @Column({
    type: DataType.UUID,

    allowNull: false,
  })
  declare submissionId: string;


  // ==========================================
  // FILE TYPE
  // ==========================================

  @Column({
    type: DataType.ENUM(
      SubmissionFileType.video,

      SubmissionFileType.projectFile,
    ),

    allowNull: false,
  })
  declare fileType: SubmissionFileType;


  // ==========================================
  // GOOGLE DRIVE FILE ID
  // ==========================================

  @Column({
    type: DataType.STRING,

    allowNull: false,
  })
  declare driveFileId: string;


  // ==========================================
  // GOOGLE DRIVE URL
  // ==========================================

  @Column({
    type: DataType.TEXT,

    allowNull: true,
  })
  declare driveFileUrl: string | null;


  // ==========================================
  // ORIGINAL FILE NAME
  // ==========================================

  @Column({
    type: DataType.STRING,

    allowNull: false,
  })
  declare fileName: string;


  // ==========================================
  // FILE SIZE
  // ==========================================

  @Column({
    type: DataType.BIGINT,

    allowNull: true,
  })
  declare fileSize: number | null;


  // ==========================================
  // MIME TYPE
  // ==========================================

  @Column({
    type: DataType.STRING,

    allowNull: true,
  })
  declare mimeType: string | null;
}


export default SubmissionFile;
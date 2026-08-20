import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";
import { NotificationAttributes } from "../types/types";
import { NotificationType } from "../../globals/types";


interface NotificationCreationAttributes
  extends Omit<
    NotificationAttributes,
    "id"
  > {
  id?: string;
}


@Table({
  tableName: "notifications",
  modelName: "Notification",
  timestamps: true,
})
class Notification extends Model<
  NotificationAttributes,
  NotificationCreationAttributes
> {

  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;


  // Person who performed the action
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare senderId: string;


  // Person who receives the notification
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare receiverId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;


  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare message: string;


  @Column({
    type: DataType.ENUM(
      NotificationType.shotAssigned,
      NotificationType.shotSubmitted,
      NotificationType.submissionApproved,
      NotificationType.submissionRedo,
      NotificationType.projectAssigned,
      NotificationType.message,
    ),
    allowNull: false,
  })
  declare type: NotificationType;


  // Frontend URL

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare url: string | null;


  // Used to know whether popup was read

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isRead: boolean;
}


export default Notification;
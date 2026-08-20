import {
  Table,
  Column,
  Model,
  DataType,
} from "sequelize-typescript";
import { MessageAttributes } from "../types/types";



interface MessageCreationAttributes
  extends Omit<MessageAttributes, "id"> {
  id?: string;
}


@Table({
  tableName: "messages",
  modelName: "Message",
  timestamps: true,
})
class Message extends Model<
  MessageAttributes,
  MessageCreationAttributes
> {

  // ==========================================
  // ID
  // ==========================================

  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;


  // ==========================================
  // Conversation ID
  // ==========================================

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare conversationId: string;


  // ==========================================
  // Sender
  // ==========================================

  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare senderId: string;


  // ==========================================
  // Message
  // ==========================================

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare message: string;


  // ==========================================
  // Read Status
  // ==========================================

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isRead: boolean;


  // ==========================================
  // Read At
  // ==========================================

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare readAt: Date | null;
}


export default Message;
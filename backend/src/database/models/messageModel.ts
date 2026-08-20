import { Table, Column, Model, DataType } from "sequelize-typescript";
import { MessageAttributes } from "../types/types";

interface MessageCreationAttributes extends Omit<
  MessageAttributes,
  "id" | "isRead"
> {
  id?: string;
  isRead?: boolean;
}

@Table({
  tableName: "messages",
  modelName: "Message",
  timestamps: true,
})
class Message extends Model<MessageAttributes, MessageCreationAttributes> {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.UUID,
  })
  declare conversationId: string;

  @Column({
    type: DataType.UUID,
  })
  declare senderId: string;

  @Column({
    type: DataType.TEXT,
  })
  declare message: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isRead: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare readAt: Date | null;
}

export default Message;

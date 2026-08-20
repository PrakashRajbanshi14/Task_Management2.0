import { Table, Column, Model, DataType } from "sequelize-typescript";
import { ConversationAttributes } from "../types/types";

interface ConversationCreationAttributes extends Omit<
  ConversationAttributes,
  "id"
> {
  id?: string;
}

@Table({
  tableName: "conversations",
  modelName: "Conversation",
  timestamps: true,
})
class Conversation extends Model<
  ConversationAttributes,
  ConversationCreationAttributes
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
  declare projectManagerId: string;

  @Column({
    type: DataType.UUID,
  })
  declare employeeId: string;

  @Column({
    type: DataType.UUID,
  })
  declare projectId: string;
}

export default Conversation;

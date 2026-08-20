import {
  Table,
  Column,
  Model,
  DataType,
  Index,
} from "sequelize-typescript";
import { ConversationAttributes } from "../types/types";


interface ConversationCreationAttributes
  extends Omit<ConversationAttributes, "id"> {
  id?: string;
}


@Table({
  tableName: "conversations",
  modelName: "Conversation",
  timestamps: true,

  indexes: [
    {
      unique: true,
      fields: ["userOneId", "userTwoId"],
    },
  ],
})
class Conversation extends Model<
  ConversationAttributes,
  ConversationCreationAttributes
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
  // User One
  // ==========================================

  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userOneId: string;


  // ==========================================
  // User Two
  // ==========================================

  @Index
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userTwoId: string;
}


export default Conversation;
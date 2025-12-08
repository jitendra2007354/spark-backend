
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model';
import Ride from './ride.model';

export interface ChatMessageAttributes {
  id: number;
  rideId: number;
  senderId: number;
  receiverId: number;
  message: string | null; // Will be null if it's a file message
  fileContent?: string; // Base64 encoded file
  fileType?: string;    // e.g., 'image/png', 'application/pdf'
  readonly createdAt?: Date;
}

interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 'id'> {}

class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreationAttributes> implements ChatMessageAttributes {
  public id!: number;
  public rideId!: number;
  public senderId!: number;
  public receiverId!: number;
  public message!: string | null;
  public fileContent?: string;
  public fileType?: string;

  public readonly createdAt!: Date;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rideId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Ride, key: 'id' },
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: 'id' },
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: 'id' },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true, // Message can be null if a file is sent
    },
    fileContent: {
        type: DataTypes.TEXT('long'), // Use LONGTEXT for base64 strings
        allowNull: true,
    },
    fileType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
  },
  {
    tableName: 'chat_messages',
    sequelize,
    timestamps: true,
  }
);

ChatMessage.belongsTo(Ride, { foreignKey: 'rideId' });
ChatMessage.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
ChatMessage.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });

export default ChatMessage;

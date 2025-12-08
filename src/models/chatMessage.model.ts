import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import Ride from './ride.model';
import User from './user.model';

// Attributes for a ChatMessage
interface ChatMessageAttributes {
  id: number;
  rideId: number; // FK to Rides
  senderId: number; // FK to Users
  receiverId: number; // FK to Users
  message: string;
  isRead: boolean;
}

// Optional attributes during creation
interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 'id' | 'isRead'> {}

class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreationAttributes> implements ChatMessageAttributes {
  public id!: number;
  public rideId!: number;
  public senderId!: number;
  public receiverId!: number;
  public message!: string;
  public isRead!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatMessage.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  rideId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Ride,
      key: 'id',
    },
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  message: {
    type: DataTypes.TEXT, // Use TEXT for potentially longer messages
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'ChatMessages',
  timestamps: true,
});

// Relationships
Ride.hasMany(ChatMessage, { foreignKey: 'rideId', as: 'chatMessages' });
ChatMessage.belongsTo(Ride, { foreignKey: 'rideId', as: 'ride' });

// A user can be a sender or a receiver
User.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(ChatMessage, { foreignKey: 'receiverId', as: 'receivedMessages' });
ChatMessage.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

export default ChatMessage;

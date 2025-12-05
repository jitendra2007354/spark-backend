import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model';

// Defines the type of notification, which can dictate its behavior in the app
export type NotificationType = 'ride' | 'offer' | 'profile' | 'payment' | 'chat' | 'general';

// Attributes for a Notification
interface NotificationAttributes {
  id: number;
  userId: number; // FK to Users, who will receive this notification
  title: string;
  message: string;
  isRead: boolean;
  type: NotificationType;
  // Optional data to help the app navigate or perform an action
  relatedData: { [key: string]: any } | null;
}

// Optional attributes during creation
interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead' | 'relatedData'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public userId!: number;
  public title!: string;
  public message!: string;
  public isRead!: boolean;
  public type!: NotificationType;
  public relatedData!: { [key: string]: any } | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('ride', 'offer', 'profile', 'payment', 'chat', 'general'),
    allowNull: false,
    defaultValue: 'general',
  },
  relatedData: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'Notifications',
  timestamps: true,
});

// Relationships
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Notification;


import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model';

// Interface for SupportTicket attributes
interface SupportTicketAttributes {
  id: number;
  userId: number;
  subject: string;
  message: string;
  status: 'Open' | 'In Progress' | 'Closed';
}

// Interface for SupportTicket creation attributes
interface SupportTicketCreationAttributes extends Optional<SupportTicketAttributes, 'id'> {}

class SupportTicket extends Model<SupportTicketAttributes, SupportTicketCreationAttributes> implements SupportTicketAttributes {
  public id!: number;
  public userId!: number;
  public subject!: string;
  public message!: string;
  public status!: 'Open' | 'In Progress' | 'Closed';

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SupportTicket.init(
  {
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
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Open', 'In Progress', 'Closed'),
      defaultValue: 'Open',
      allowNull: false,
    },
  },
  {
    tableName: 'support_tickets',
    sequelize,
  }
);

// Establish the relationship
SupportTicket.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(SupportTicket, { foreignKey: 'userId' });

export default SupportTicket;

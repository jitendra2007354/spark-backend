import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface SupportTicketAttributes {
  id: number;
  userId: number;
  subject: string;
  description: string;
  status: TicketStatus;
}

interface SupportTicketCreationAttributes extends Optional<SupportTicketAttributes, 'id' | 'status'> {}

class SupportTicket extends Model<SupportTicketAttributes, SupportTicketCreationAttributes> implements SupportTicketAttributes {
  public id!: number;
  public userId!: number;
  public subject!: string;
  public description!: string;
  public status!: TicketStatus;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SupportTicket.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  subject: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'), defaultValue: 'OPEN' },
}, {
  tableName: 'support_tickets',
  sequelize,
});

User.hasMany(SupportTicket, { foreignKey: 'userId', as: 'supportTickets' });
SupportTicket.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default SupportTicket;

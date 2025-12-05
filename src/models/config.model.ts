import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../services/database.service';

export interface ConfigAttributes {
  id: number;
  key: string; 
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  commissionRate: number; 
  cancellationFee: number;
  driverSearchRadius: number;
  rideAcceptTime: number; 
  walletMinBalance: number;
  autoBlockHours: number; 
  surgeMultiplier: number;
  taxRate: number; // Percentage (e.g., 5 for 5%)
  cancellationGracePeriod: number; // in seconds
}

export interface ConfigCreationAttributes extends Optional<ConfigAttributes, 'id'> {}

class Config extends Model<ConfigAttributes, ConfigCreationAttributes> implements ConfigAttributes {
  public id!: number;
  public key!: string;
  public baseFare!: number;
  public perKmRate!: number;
  public perMinuteRate!: number;
  public commissionRate!: number;
  public cancellationFee!: number;
  public driverSearchRadius!: number;
  public rideAcceptTime!: number;
  public walletMinBalance!: number;
  public autoBlockHours!: number;
  public surgeMultiplier!: number;
  public taxRate!: number;
  public cancellationGracePeriod!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Config.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  baseFare: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  perKmRate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  perMinuteRate: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 1 },
  commissionRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  cancellationFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  driverSearchRadius: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  rideAcceptTime: { type: DataTypes.INTEGER, allowNull: false },
  walletMinBalance: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  autoBlockHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 24 },
  surgeMultiplier: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 1 },
  taxRate: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 5 },
  cancellationGracePeriod: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
}, {
  tableName: 'configs',
  sequelize,
});

export default Config;

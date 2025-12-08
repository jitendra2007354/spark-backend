import { Model, DataTypes } from 'sequelize';
import sequelize from '../services/database.service';

class PricingRule extends Model {
  public id!: number;
  public category!: 'Base' | 'Commission' | 'Tax' | 'Penalty' | 'Timings';
  public scope!: 'Global' | 'State' | 'City';
  public state?: string;
  public city?: string;
  public vehicleType?: string;
  public baseRate?: number;
  public perUnit?: number;
  public amount?: number;
  public perRides?: number;
  public name?: string;
  public value?: number;
  public taxType?: 'Percentage' | 'Fixed';
  public role?: 'Driver' | 'Customer' | 'CampOwner';
  public cancelLimit?: number;
  public penaltyAmount?: number;
  public acceptTime?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PricingRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category: {
      type: DataTypes.ENUM('Base', 'Commission', 'Tax', 'Penalty', 'Timings'),
      allowNull: false,
    },
    scope: {
      type: DataTypes.ENUM('Global', 'State', 'City'),
      allowNull: false,
      defaultValue: 'Global',
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vehicleType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    baseRate: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    perUnit: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    perRides: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    value: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    taxType: {
      type: DataTypes.ENUM('Percentage', 'Fixed'),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('Driver', 'Customer', 'CampOwner'),
      allowNull: true,
    },
    cancelLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    penaltyAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    acceptTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'pricing_rules',
  }
);

export default PricingRule;

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import Ride from './ride.model';

// Attributes for a Bill
interface BillAttributes {
  id: number;
  rideId: number; // FK to Rides

  // Fare breakdown
  baseFare: number;
  distanceFare: number;
  timeFare: number; // Fare based on duration
  platformFee: number; // The platform's commission
  taxes: number;
  
  // Adjustments
  penalty: number; // e.g., for cancellation
  discount: number; // e.g., from a promo code

  // Final Amount
  totalAmount: number; // The final amount charged to the customer
  driverEarnings: number; // The amount the driver receives
}

// Optional attributes during creation
interface BillCreationAttributes extends Optional<BillAttributes, 'id' | 'penalty' | 'discount'> {}

class Bill extends Model<BillAttributes, BillCreationAttributes> implements BillAttributes {
  public id!: number;
  public rideId!: number;

  public baseFare!: number;
  public distanceFare!: number;
  public timeFare!: number;
  public platformFee!: number;
  public taxes!: number;
  
  public penalty!: number;
  public discount!: number;

  public totalAmount!: number;
  public driverEarnings!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Bill.init({
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
    unique: true, // A ride can only have one bill
  },
  baseFare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  distanceFare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  timeFare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  platformFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  taxes: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  penalty: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  driverEarnings: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'Bills',
  timestamps: true,
});

// Relationships
Ride.hasOne(Bill, { foreignKey: 'rideId', as: 'bill' });
Bill.belongsTo(Ride, { foreignKey: 'rideId', as: 'ride' });

export default Bill;

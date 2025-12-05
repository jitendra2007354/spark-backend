import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import Ride from './ride.model';
import Driver from './driver.model';

// Attributes for a Bid
interface BidAttributes {
  id: number;
  rideId: number; // FK to Rides
  driverId: number; // FK to Drivers
  amount: number; // The amount the driver is bidding
  isAccepted: boolean; // Has this bid been accepted by the customer?
}

// Optional attributes during creation
interface BidCreationAttributes extends Optional<BidAttributes, 'id' | 'isAccepted'> {}

class Bid extends Model<BidAttributes, BidCreationAttributes> implements BidAttributes {
  public id!: number;
  public rideId!: number;
  public driverId!: number;
  public amount!: number;
  public isAccepted!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Bid.init({
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
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Driver,
      key: 'id',
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  isAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  sequelize,
  tableName: 'Bids',
  timestamps: true,
  // Ensure a driver can only bid once per ride
  indexes: [
    {
      unique: true,
      fields: ['rideId', 'driverId']
    }
  ]
});

// Relationships
Ride.hasMany(Bid, { foreignKey: 'rideId', as: 'bids' });
Bid.belongsTo(Ride, { foreignKey: 'rideId', as: 'ride' });

Driver.hasMany(Bid, { foreignKey: 'driverId', as: 'bids' });
Bid.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

export default Bid;

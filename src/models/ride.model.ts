import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model';
import Driver from './driver.model';

// Ride Statuses
export type RideStatus = 'pending' | 'accepted' | 'ongoing' | 'completed' | 'cancelled' | 'expired' | 'searching' | 'no_drivers' | 'confirmed' | 'cancelled_with_penalty';

// Location format
interface Location {
    latitude: number;
    longitude: number;
}

// Attributes for a Ride
interface RideAttributes {
  id: number;
  customerId: number; // FK to Users
  driverId: number | null; // FK to Drivers, null until accepted
  
  pickupLocation: Location;
  dropoffLocation: Location;
  pickupAddress: string;
  dropoffAddress: string;

  // The type of vehicle requested by the customer
  vehicleType: 'Bike' | 'Auto' | 'Car' | 'Car 6-Seater';

  status: RideStatus;
  finalFare?: number;
  rejectedBy?: string; // Comma-separated list of driver IDs
}

// Optional attributes during creation
interface RideCreationAttributes extends Optional<RideAttributes, 'id' | 'driverId' | 'status' | 'rejectedBy'> {}

class Ride extends Model<RideAttributes, RideCreationAttributes> implements RideAttributes {
  public id!: number;
  public customerId!: number;
  public driverId!: number | null;
  
  public pickupLocation!: Location;
  public dropoffLocation!: Location;
  public pickupAddress!: string;
  public dropoffAddress!: string;

  public vehicleType!: 'Bike' | 'Auto' | 'Car' | 'Car 6-Seater';

  public status!: RideStatus;
  public finalFare?: number;
  public rejectedBy?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Ride.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true, // A driver is assigned later
    references: {
      model: Driver,
      key: 'id',
    },
  },
  pickupLocation: {
    type: DataTypes.JSONB, // Use JSONB for efficient querying
    allowNull: false,
  },
  dropoffLocation: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  pickupAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dropoffAddress: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleType: {
    type: DataTypes.ENUM('Bike', 'Auto', 'Car', 'Car 6-Seater'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'ongoing', 'completed', 'cancelled', 'expired', 'searching', 'no_drivers', 'confirmed', 'cancelled_with_penalty'),
    defaultValue: 'pending',
    allowNull: false,
  },
  finalFare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  rejectedBy: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'Rides',
  timestamps: true,
});

// Relationships
User.hasMany(Ride, { foreignKey: 'customerId', as: 'customerRides' });
Ride.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

Driver.hasMany(Ride, { foreignKey: 'driverId', as: 'driverRides' });
Ride.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

export default Ride;

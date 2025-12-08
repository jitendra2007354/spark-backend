import { Model, DataTypes, BelongsToGetAssociationMixin } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model';
import Driver from './driver.model'; // Import the Driver model

// Corrected and consolidated ride statuses
export enum RideStatus {
  PENDING = 'pending',       // Ride has been requested, awaiting driver assignment
  ASSIGNING = 'assigning',   // A driver is being offered the ride
  ACCEPTED = 'accepted',     // A driver has accepted the ride
  ARRIVED = 'arrived',       // The driver has arrived at the pickup location
  IN_PROGRESS = 'in-progress', // The ride is underway
  COMPLETED = 'completed',     // The ride has been successfully completed
  CANCELLED = 'cancelled',     // The ride has been cancelled
}

class Ride extends Model {
  public id!: number;
  public customerId!: number;
  public driverId?: number;
  public status!: RideStatus;
  public fare!: number;
  public driverEarning!: number;
  public pickupLocation!: { latitude: number; longitude: number };
  public destinationLocation!: { latitude: number; longitude: number };
  public vehicleType!: string;

  // Fields for the sequential assignment logic
  public currentDriverId?: number;
  public offerExpiresAt?: Date;
  public rejectedDriverIds?: number[]; // Stored as JSON

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public getCustomer!: BelongsToGetAssociationMixin<User>;
  // The 'driver' association will now correctly point to the Driver model
  public getDriver!: BelongsToGetAssociationMixin<Driver>; 
  public driver?: Driver;
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
    references: { model: User, key: 'id' },
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Driver, key: 'id' }, // Correctly reference the drivers table
  },
  status: {
    type: DataTypes.ENUM(...Object.values(RideStatus)),
    allowNull: false,
    defaultValue: RideStatus.PENDING,
  },
  fare: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  driverEarning: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  pickupLocation: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  destinationLocation: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  vehicleType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // New fields for assignment logic
  currentDriverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: Driver, key: 'id' },
  },
  offerExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rejectedDriverIds: {
    type: DataTypes.JSON, // Storing an array of IDs
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'rides',
});

// Associations
Ride.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
User.hasMany(Ride, { as: 'ridesAsCustomer', foreignKey: 'customerId' });

// A Ride belongs to one Driver
// This was the source of a major bug, it is now corrected.
Ride.belongsTo(Driver, { as: 'driver', foreignKey: 'driverId' });
Driver.hasMany(Ride, { as: 'ridesAsDriver', foreignKey: 'driverId' });

export default Ride;

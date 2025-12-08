import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model';

// Attributes match the exact data sent from the driver app
interface DriverAttributes {
  id: number;
  userId: number; // Foreign key to the Users table
  
  // Driver's personal license details
  driverLicenseNumber: string;
  driverLicensePhotoUrl: string;

  // Vehicle details
  vehicleModel: string;
  vehicleNumber: string; // This is the license plate
  vehicleType: 'Bike' | 'Auto' | 'Car' | 'Car 6-Seater';
  rcPhotoUrl: string;    // URL for the Registration Certificate photo

  // System-managed fields
  isApproved: boolean;   // For admin approval
  averageRating: number; // Replaces the old 'rating' field
  currentLat?: number;
  currentLng?: number;
  outstandingPlatformFee?: number;
}

// Optional attributes during creation
interface DriverCreationAttributes extends Optional<DriverAttributes, 'id' | 'isApproved' | 'averageRating'> {}

class Driver extends Model<DriverAttributes, DriverCreationAttributes> implements DriverAttributes {
  public id!: number;
  public userId!: number;
  public driverLicenseNumber!: string;
  public driverLicensePhotoUrl!: string;
  public vehicleModel!: string;
  public vehicleNumber!: string;
  public vehicleType!: 'Bike' | 'Auto' | 'Car' | 'Car 6-Seater';
  public rcPhotoUrl!: string;
  public isApproved!: boolean;
  public averageRating!: number; // Corrected field name
  public currentLat?: number;
  public currentLng?: number;
  public outstandingPlatformFee?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Driver.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id',
    },
  },
  driverLicenseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  driverLicensePhotoUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleModel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  vehicleType: {
    type: DataTypes.ENUM('Bike', 'Auto', 'Car', 'Car 6-Seater'),
    allowNull: false,
  },
  rcPhotoUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  averageRating: { // This field was missing, causing a build error.
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 5.00,
  },
  currentLat: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  currentLng: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  outstandingPlatformFee: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
}, {
  sequelize,
  tableName: 'Drivers',
  timestamps: true,
});

// Establish the one-to-one relationship
User.hasOne(Driver, { foreignKey: 'userId', as: 'driverProfile' });
Driver.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default Driver;

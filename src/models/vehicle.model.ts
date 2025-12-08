import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model';

// Define the vehicle types based on your feature list
export type VehicleType = 'Bike' | 'Auto' | 'Car4Seater' | 'Car6Seater';

// Define the attributes for the Vehicle model
interface VehicleAttributes {
  id: number;
  userId: number; // Foreign key for the User (Driver)
  vehicleNumber: string;
  vehicleModel: string;
  vehicleType: VehicleType;
  rcPhotoUrl: string;
  licensePhotoUrl: string;
  isDefault: boolean; // To mark one vehicle as the driver's default
  isDeleted: boolean; // For soft-deletes
}

// Some attributes are optional during creation
interface VehicleCreationAttributes extends Optional<VehicleAttributes, 'id' | 'isDeleted'> {}

// Define the Vehicle model class
class Vehicle extends Model<VehicleAttributes, VehicleCreationAttributes> implements VehicleAttributes {
  public id!: number;
  public userId!: number;
  public vehicleNumber!: string;
  public vehicleModel!: string;
  public vehicleType!: VehicleType;
  public rcPhotoUrl!: string;
  public licensePhotoUrl!: string;
  public isDefault!: boolean;
  public isDeleted!: boolean;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the Vehicle model
Vehicle.init({
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
  vehicleNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  vehicleModel: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  vehicleType: {
    type: DataTypes.ENUM('Bike', 'Auto', 'Car4Seater', 'Car6Seater'),
    allowNull: false,
  },
  rcPhotoUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  licensePhotoUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isDeleted: { // Added for soft-delete functionality
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'vehicles',
  sequelize,
});

// Set up the association: a User (Driver) can have many Vehicles
User.hasMany(Vehicle, { foreignKey: 'userId', as: 'vehicles' });
Vehicle.belongsTo(User, { foreignKey: 'userId', as: 'driver' });

export default Vehicle;

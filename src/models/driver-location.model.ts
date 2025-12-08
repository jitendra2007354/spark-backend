import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model'; // Assuming you have a User model

interface DriverLocationAttributes {
  id: number;
  driverId: number;
  // The location is stored as a POINT for geospatial queries
  location: { type: 'Point', coordinates: [number, number] }; 
  updatedAt: Date;
}

// We don't need creation attributes, as we will use `upsert`.
interface DriverLocationCreationAttributes extends Optional<DriverLocationAttributes, 'id' | 'updatedAt'> {}

class DriverLocation extends Model<DriverLocationAttributes, DriverLocationCreationAttributes> implements DriverLocationAttributes {
  public id!: number;
  public driverId!: number;
  public location!: { type: 'Point', coordinates: [number, number] }; 
  public readonly updatedAt!: Date;

  public readonly createdAt!: Date;
}

DriverLocation.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // Each driver has only one latest location entry
    references: {
      model: User,
      key: 'id',
    },
  },
  // Use a GEOMETRY type for efficient spatial queries.
  location: {
    type: DataTypes.GEOMETRY('POINT'),
    allowNull: false,
  },
  updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'driver_locations',
  sequelize,
  timestamps: true, // Enable timestamps
  indexes: [
    // Create a spatial index on the location column
    {
      name: 'spatial_location_index',
      using: 'SPATIAL',
      fields: ['location']
    }
  ]
});

export default DriverLocation;

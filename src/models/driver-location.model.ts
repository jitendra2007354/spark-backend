import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import User from './user.model'; // Assuming you have a User model

interface DriverLocationAttributes {
  id: number;
  driverId: number;
  latitude: number;
  longitude: number;
  updatedAt: Date;
}

// We don't need creation attributes, as we will use `upsert`.
interface DriverLocationCreationAttributes extends Optional<DriverLocationAttributes, 'id' | 'updatedAt'> {}

class DriverLocation extends Model<DriverLocationAttributes, DriverLocationCreationAttributes> implements DriverLocationAttributes {
  public id!: number;
  public driverId!: number;
  public latitude!: number;
  public longitude!: number;
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
  latitude: {
    type: DataTypes.DECIMAL(9, 6), // Precision for GPS coordinates
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(9, 6),
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
});

export default DriverLocation;

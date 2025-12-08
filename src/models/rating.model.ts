import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../services/database.service';
import Ride from './ride.model';
import User from './user.model';

// Attributes for a Rating
interface RatingAttributes {
  id: number;
  rideId: number;
  raterId: number; // The user giving the rating (customer)
  ratedId: number; // The user being rated (driver)
  rating: number; // e.g., 1 to 5
  comment?: string;
}

// Optional attributes during creation
interface RatingCreationAttributes extends Optional<RatingAttributes, 'id'> {}

class Rating extends Model<RatingAttributes, RatingCreationAttributes> implements RatingAttributes {
  public id!: number;
  public rideId!: number;
  public raterId!: number;
  public ratedId!: number;
  public rating!: number;
  public comment?: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Rating.init({
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
    unique: true, // A ride can only be rated once
  },
  raterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  ratedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'ratings',
  sequelize,
  timestamps: true,
});

export default Rating;

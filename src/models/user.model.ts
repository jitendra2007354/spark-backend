import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../services/database.service';

// Attributes match the exact data sent from the app
interface UserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber: string;
  pfp?: string;
  city?: string;
  state?: string;
  userType: 'Customer' | 'Driver' | 'Admin';
  isOnline: boolean;
  isBlocked: boolean;
  walletBalance: number;
  lowBalanceSince: Date | null;
  driverPicUrl?: string;
  licenseUrl?: string;
  rcUrl?: string;
  driverPicIsVerified?: boolean; // New
  licenseIsVerified?: boolean; // New
  rcIsVerified?: boolean;      // New
  averageRating: number;
  outstandingPlatformFee: number;
  currentLat?: number;
  currentLng?: number;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isOnline' | 'isBlocked' | 'walletBalance' | 'lowBalanceSince' | 'averageRating' | 'outstandingPlatformFee' | 'driverPicIsVerified' | 'licenseIsVerified' | 'rcIsVerified'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email?: string;
  public phoneNumber!: string;
  public pfp?: string;
  public city?: string;
  public state?: string;
  public userType!: 'Customer' | 'Driver' | 'Admin';
  public isOnline!: boolean;
  public isBlocked!: boolean;
  public walletBalance!: number;
  public lowBalanceSince!: Date | null;
  public driverPicUrl?: string;
  public licenseUrl?: string;
  public rcUrl?: string;
  public driverPicIsVerified?: boolean;
  public licenseIsVerified?: boolean;
  public rcIsVerified?: boolean;
  public averageRating!: number;
  public outstandingPlatformFee!: number;
  public currentLat?: number;
  public currentLng?: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  phoneNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  pfp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userType: {
    type: DataTypes.ENUM('Customer', 'Driver', 'Admin'),
    defaultValue: 'Customer',
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  walletBalance: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  lowBalanceSince: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  driverPicUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  licenseUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rcUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  driverPicIsVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  licenseIsVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  rcIsVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  averageRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  outstandingPlatformFee: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  currentLat: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  currentLng: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
  sequelize,
  tableName: 'Users',
  timestamps: true,
});

export default User;
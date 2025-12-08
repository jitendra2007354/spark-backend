"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
class User extends sequelize_1.Model {
}
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        unique: true,
    },
    phoneNumber: {
        type: sequelize_1.DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    pfp: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    city: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    state: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    userType: {
        type: sequelize_1.DataTypes.ENUM('Customer', 'Driver', 'Admin'),
        defaultValue: 'Customer',
    },
    isOnline: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isBlocked: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    walletBalance: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0,
    },
    lowBalanceSince: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    driverPicUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    licenseUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    rcUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    driverPicIsVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    licenseIsVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    rcIsVerified: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    averageRating: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0,
    },
    outstandingPlatformFee: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0,
    },
    currentLat: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    currentLng: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'Users',
    timestamps: true,
});
exports.default = User;

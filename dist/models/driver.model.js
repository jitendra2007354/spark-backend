"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const user_model_1 = __importDefault(require("./user.model"));
class Driver extends sequelize_1.Model {
}
Driver.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: user_model_1.default,
            key: 'id',
        },
    },
    driverLicenseNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    driverLicensePhotoUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    vehicleModel: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    vehicleNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    vehicleType: {
        type: sequelize_1.DataTypes.ENUM('Bike', 'Auto', 'Car', 'Car 6-Seater'),
        allowNull: false,
    },
    rcPhotoUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    isApproved: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    averageRating: {
        type: sequelize_1.DataTypes.DECIMAL(3, 2),
        defaultValue: 5.00,
    },
    currentLat: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    currentLng: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    outstandingPlatformFee: {
        type: sequelize_1.DataTypes.FLOAT,
        defaultValue: 0,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'Drivers',
    timestamps: true,
});
// Establish the one-to-one relationship
user_model_1.default.hasOne(Driver, { foreignKey: 'userId', as: 'driverProfile' });
Driver.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'user' });
exports.default = Driver;

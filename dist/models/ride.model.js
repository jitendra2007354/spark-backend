"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const user_model_1 = __importDefault(require("./user.model"));
const driver_model_1 = __importDefault(require("./driver.model"));
class Ride extends sequelize_1.Model {
}
Ride.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    customerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: user_model_1.default,
            key: 'id',
        },
    },
    driverId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true, // A driver is assigned later
        references: {
            model: driver_model_1.default,
            key: 'id',
        },
    },
    pickupLocation: {
        type: sequelize_1.DataTypes.JSONB, // Use JSONB for efficient querying
        allowNull: false,
    },
    dropoffLocation: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    pickupAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    dropoffAddress: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    vehicleType: {
        type: sequelize_1.DataTypes.ENUM('Bike', 'Auto', 'Car', 'Car 6-Seater'),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('pending', 'accepted', 'ongoing', 'completed', 'cancelled', 'expired', 'searching', 'no_drivers', 'confirmed', 'cancelled_with_penalty'),
        defaultValue: 'pending',
        allowNull: false,
    },
    finalFare: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    rejectedBy: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'Rides',
    timestamps: true,
});
// Relationships
user_model_1.default.hasMany(Ride, { foreignKey: 'customerId', as: 'customerRides' });
Ride.belongsTo(user_model_1.default, { foreignKey: 'customerId', as: 'customer' });
driver_model_1.default.hasMany(Ride, { foreignKey: 'driverId', as: 'driverRides' });
Ride.belongsTo(driver_model_1.default, { foreignKey: 'driverId', as: 'driver' });
exports.default = Ride;

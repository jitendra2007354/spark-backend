"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideStatus = void 0;
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const user_model_1 = __importDefault(require("./user.model"));
const driver_model_1 = __importDefault(require("./driver.model")); // Import the Driver model
// Corrected and consolidated ride statuses
var RideStatus;
(function (RideStatus) {
    RideStatus["PENDING"] = "pending";
    RideStatus["ASSIGNING"] = "assigning";
    RideStatus["ACCEPTED"] = "accepted";
    RideStatus["ARRIVED"] = "arrived";
    RideStatus["IN_PROGRESS"] = "in-progress";
    RideStatus["COMPLETED"] = "completed";
    RideStatus["CANCELLED"] = "cancelled";
})(RideStatus || (exports.RideStatus = RideStatus = {}));
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
        references: { model: user_model_1.default, key: 'id' },
    },
    driverId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: { model: driver_model_1.default, key: 'id' }, // Correctly reference the drivers table
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(RideStatus)),
        allowNull: false,
        defaultValue: RideStatus.PENDING,
    },
    fare: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    driverEarning: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    pickupLocation: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    destinationLocation: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: false,
    },
    vehicleType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    // New fields for assignment logic
    currentDriverId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
        references: { model: driver_model_1.default, key: 'id' },
    },
    offerExpiresAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    rejectedDriverIds: {
        type: sequelize_1.DataTypes.JSON, // Storing an array of IDs
        allowNull: true,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'rides',
});
// Associations
Ride.belongsTo(user_model_1.default, { as: 'customer', foreignKey: 'customerId' });
user_model_1.default.hasMany(Ride, { as: 'ridesAsCustomer', foreignKey: 'customerId' });
// A Ride belongs to one Driver
// This was the source of a major bug, it is now corrected.
Ride.belongsTo(driver_model_1.default, { as: 'driver', foreignKey: 'driverId' });
driver_model_1.default.hasMany(Ride, { as: 'ridesAsDriver', foreignKey: 'driverId' });
exports.default = Ride;

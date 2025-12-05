"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const user_model_1 = __importDefault(require("./user.model")); // Assuming you have a User model
class DriverLocation extends sequelize_1.Model {
}
DriverLocation.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    driverId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Each driver has only one latest location entry
        references: {
            model: user_model_1.default,
            key: 'id',
        },
    },
    latitude: {
        type: sequelize_1.DataTypes.DECIMAL(9, 6), // Precision for GPS coordinates
        allowNull: false,
    },
    longitude: {
        type: sequelize_1.DataTypes.DECIMAL(9, 6),
        allowNull: false,
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW,
    }
}, {
    tableName: 'driver_locations',
    sequelize: database_service_1.default,
    timestamps: true, // Enable timestamps
});
exports.default = DriverLocation;

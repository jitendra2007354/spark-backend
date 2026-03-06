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
    // Use a GEOMETRY type for efficient spatial queries.
    location: {
        type: sequelize_1.DataTypes.GEOMETRY('POINT'),
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
    indexes: [
        // Create a spatial index on the location column
        {
            name: 'spatial_location_index',
            using: 'SPATIAL',
            fields: ['location']
        }
    ]
});
exports.default = DriverLocation;

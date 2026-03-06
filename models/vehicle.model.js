"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const user_model_1 = __importDefault(require("./user.model"));
// Define the Vehicle model class
class Vehicle extends sequelize_1.Model {
}
// Initialize the Vehicle model
Vehicle.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: user_model_1.default,
            key: 'id',
        },
    },
    vehicleNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    vehicleModel: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    vehicleType: {
        type: sequelize_1.DataTypes.ENUM('Bike', 'Auto', 'Car4Seater', 'Car6Seater'),
        allowNull: false,
    },
    rcPhotoUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    licensePhotoUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    isDefault: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    isDeleted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'vehicles',
    sequelize: database_service_1.default,
});
// Set up the association: a User (Driver) can have many Vehicles
user_model_1.default.hasMany(Vehicle, { foreignKey: 'userId', as: 'vehicles' });
Vehicle.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'driver' });
exports.default = Vehicle;

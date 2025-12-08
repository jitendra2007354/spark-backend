"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const ride_model_1 = __importDefault(require("./ride.model"));
const driver_model_1 = __importDefault(require("./driver.model"));
class Bid extends sequelize_1.Model {
}
Bid.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    rideId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: ride_model_1.default,
            key: 'id',
        },
    },
    driverId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: driver_model_1.default,
            key: 'id',
        },
    },
    amount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    isAccepted: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'Bids',
    timestamps: true,
    // Ensure a driver can only bid once per ride
    indexes: [
        {
            unique: true,
            fields: ['rideId', 'driverId']
        }
    ]
});
// Relationships
ride_model_1.default.hasMany(Bid, { foreignKey: 'rideId', as: 'bids' });
Bid.belongsTo(ride_model_1.default, { foreignKey: 'rideId', as: 'ride' });
driver_model_1.default.hasMany(Bid, { foreignKey: 'driverId', as: 'bids' });
Bid.belongsTo(driver_model_1.default, { foreignKey: 'driverId', as: 'driver' });
exports.default = Bid;

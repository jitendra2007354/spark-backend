"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const ride_model_1 = __importDefault(require("./ride.model"));
class Bill extends sequelize_1.Model {
}
Bill.init({
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
        unique: true, // A ride can only have one bill
    },
    baseFare: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    distanceFare: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    timeFare: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    platformFee: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    taxes: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    penalty: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
    },
    discount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
        allowNull: false,
    },
    totalAmount: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    driverEarnings: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'Bills',
    timestamps: true,
});
// Relationships
ride_model_1.default.hasOne(Bill, { foreignKey: 'rideId', as: 'bill' });
Bill.belongsTo(ride_model_1.default, { foreignKey: 'rideId', as: 'ride' });
exports.default = Bill;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
class Config extends sequelize_1.Model {
}
Config.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    key: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    baseFare: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false },
    perKmRate: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false },
    perMinuteRate: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 1 },
    commissionRate: { type: sequelize_1.DataTypes.DECIMAL(5, 2), allowNull: false },
    cancellationFee: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false },
    driverSearchRadius: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false },
    rideAcceptTime: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    walletMinBalance: { type: sequelize_1.DataTypes.DECIMAL(10, 2), allowNull: false },
    autoBlockHours: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 24 },
    surgeMultiplier: { type: sequelize_1.DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 1 },
    taxRate: { type: sequelize_1.DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 5 },
    cancellationGracePeriod: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
}, {
    tableName: 'configs',
    sequelize: database_service_1.default,
});
exports.default = Config;

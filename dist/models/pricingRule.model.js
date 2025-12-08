"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
class PricingRule extends sequelize_1.Model {
}
PricingRule.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    category: {
        type: sequelize_1.DataTypes.ENUM('Base', 'Commission', 'Tax', 'Penalty', 'Timings'),
        allowNull: false,
    },
    scope: {
        type: sequelize_1.DataTypes.ENUM('Global', 'State', 'City'),
        allowNull: false,
        defaultValue: 'Global',
    },
    state: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    city: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    vehicleType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    baseRate: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    perUnit: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    amount: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    perRides: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    value: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    taxType: {
        type: sequelize_1.DataTypes.ENUM('Percentage', 'Fixed'),
        allowNull: true,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('Driver', 'Customer', 'CampOwner'),
        allowNull: true,
    },
    cancelLimit: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
    penaltyAmount: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true,
    },
    acceptTime: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'pricing_rules',
});
exports.default = PricingRule;

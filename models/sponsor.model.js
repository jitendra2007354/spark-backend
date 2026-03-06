"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
class Sponsor extends sequelize_1.Model {
}
Sponsor.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: sequelize_1.DataTypes.STRING, allowNull: false, unique: true },
    password: { type: sequelize_1.DataTypes.STRING, allowNull: false },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    profileImage: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    role: { type: sequelize_1.DataTypes.ENUM('admin', 'editor'), defaultValue: 'editor', allowNull: false },
    remainingLimit: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 100, allowNull: false },
    totalLimit: { type: sequelize_1.DataTypes.INTEGER, defaultValue: 100, allowNull: false },
    validUntil: { type: sequelize_1.DataTypes.DATE, allowNull: true },
    customHtmlTemplate: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    gamReportsEnabled: { type: sequelize_1.DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    gamAdvertiserId: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    gamOrderId: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    gamLineItemId: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    gamNetworkCode: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    gamAdUnitId: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    serviceAccount: { type: sequelize_1.DataTypes.JSON, allowNull: true },
    bannerImage: { type: sequelize_1.DataTypes.STRING, allowNull: true },
}, {
    sequelize: database_service_1.default,
    tableName: 'Sponsors',
});
exports.default = Sponsor;

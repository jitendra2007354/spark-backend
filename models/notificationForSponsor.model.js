"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
class NotificationForSponsor extends sequelize_1.Model {
}
NotificationForSponsor.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    sponsorId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT, // TEXT type to hold HTML content
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'info',
    },
    read: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    likes: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    liked: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    media: {
        type: sequelize_1.DataTypes.JSON, // Stores array of {type: 'image'|'video', url: '...'}
        allowNull: true,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'notification_for_sponsor',
});
exports.default = NotificationForSponsor;

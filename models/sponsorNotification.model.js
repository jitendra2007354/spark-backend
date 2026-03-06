"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const sponsor_model_1 = __importDefault(require("./sponsor.model"));
class SponsorNotification extends sequelize_1.Model {
}
SponsorNotification.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    sponsorId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: sponsor_model_1.default,
            key: 'id'
        }
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    target: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    attachments: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
    sentAt: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    scheduledFor: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: 'sent',
    },
    recipientCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    driverCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    customerCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    }
}, {
    sequelize: database_service_1.default,
    tableName: 'SponsorNotifications',
});
exports.default = SponsorNotification;

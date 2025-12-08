"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const user_model_1 = __importDefault(require("./user.model"));
class Notification extends sequelize_1.Model {
}
Notification.init({
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
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
    type: {
        type: sequelize_1.DataTypes.ENUM('ride', 'offer', 'profile', 'payment', 'chat', 'general'),
        allowNull: false,
        defaultValue: 'general',
    },
    relatedData: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: true,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'Notifications',
    timestamps: true,
});
// Relationships
user_model_1.default.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'user' });
exports.default = Notification;

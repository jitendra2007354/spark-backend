"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const user_model_1 = __importDefault(require("./user.model"));
class SupportTicket extends sequelize_1.Model {
}
SupportTicket.init({
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
    subject: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('Open', 'In Progress', 'Closed'),
        defaultValue: 'Open',
        allowNull: false,
    },
}, {
    tableName: 'support_tickets',
    sequelize: database_service_1.default,
});
// Establish the relationship
SupportTicket.belongsTo(user_model_1.default, { foreignKey: 'userId' });
user_model_1.default.hasMany(SupportTicket, { foreignKey: 'userId' });
exports.default = SupportTicket;

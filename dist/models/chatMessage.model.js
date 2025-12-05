"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const ride_model_1 = __importDefault(require("./ride.model"));
const user_model_1 = __importDefault(require("./user.model"));
class ChatMessage extends sequelize_1.Model {
}
ChatMessage.init({
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
    senderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: user_model_1.default,
            key: 'id',
        },
    },
    receiverId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: user_model_1.default,
            key: 'id',
        },
    },
    message: {
        type: sequelize_1.DataTypes.TEXT, // Use TEXT for potentially longer messages
        allowNull: false,
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    sequelize: database_service_1.default,
    tableName: 'ChatMessages',
    timestamps: true,
});
// Relationships
ride_model_1.default.hasMany(ChatMessage, { foreignKey: 'rideId', as: 'chatMessages' });
ChatMessage.belongsTo(ride_model_1.default, { foreignKey: 'rideId', as: 'ride' });
// A user can be a sender or a receiver
user_model_1.default.hasMany(ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
ChatMessage.belongsTo(user_model_1.default, { foreignKey: 'senderId', as: 'sender' });
user_model_1.default.hasMany(ChatMessage, { foreignKey: 'receiverId', as: 'receivedMessages' });
ChatMessage.belongsTo(user_model_1.default, { foreignKey: 'receiverId', as: 'receiver' });
exports.default = ChatMessage;

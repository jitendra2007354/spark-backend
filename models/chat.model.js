"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_service_1 = __importDefault(require("../services/database.service"));
const user_model_1 = __importDefault(require("./user.model"));
const ride_model_1 = __importDefault(require("./ride.model"));
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
        references: { model: ride_model_1.default, key: 'id' },
    },
    senderId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: user_model_1.default, key: 'id' },
    },
    receiverId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: user_model_1.default, key: 'id' },
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true, // Message can be null if a file is sent
    },
    fileContent: {
        type: sequelize_1.DataTypes.TEXT('long'), // Use LONGTEXT for base64 strings
        allowNull: true,
    },
    fileType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'chat_messages',
    sequelize: database_service_1.default,
    timestamps: true,
});
ChatMessage.belongsTo(ride_model_1.default, { foreignKey: 'rideId' });
ChatMessage.belongsTo(user_model_1.default, { as: 'sender', foreignKey: 'senderId' });
ChatMessage.belongsTo(user_model_1.default, { as: 'receiver', foreignKey: 'receiverId' });
exports.default = ChatMessage;

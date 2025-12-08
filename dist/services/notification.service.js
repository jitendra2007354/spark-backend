"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminNotification = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const websocket_service_1 = require("./websocket.service");
const sequelize_1 = require("sequelize");
/**
 * Sends a notification from the admin panel to a specified target group.
 *
 * @param target - Who the notification is for.
 * @param payload - The content of the notification.
 */
const sendAdminNotification = (target, payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Attempting to send notification to: ${target}`);
    const whereClause = {};
    if (target === 'drivers') {
        whereClause.userType = 'Driver';
    }
    else if (target === 'customers') {
        whereClause.userType = 'Customer';
    }
    else if (Array.isArray(target)) {
        whereClause.id = { [sequelize_1.Op.in]: target };
    }
    // If target is 'all', the whereClause remains empty, selecting all users.
    try {
        const users = yield user_model_1.default.findAll({ where: whereClause, attributes: ['id'] });
        if (users.length === 0) {
            console.log('No users found for the specified target.');
            return;
        }
        // Send the notification to each targeted user via WebSocket
        users.forEach(user => {
            (0, websocket_service_1.sendMessageToUser)(user.id, 'admin_notification', payload);
        });
        console.log(`Successfully sent notification to ${users.length} users.`);
    }
    catch (error) {
        console.error('Failed to send admin notification:', error);
        // Depending on requirements, you might want to throw the error
        // so the calling API endpoint can return a 500 status.
        throw new Error('Database query for users failed.');
    }
});
exports.sendAdminNotification = sendAdminNotification;

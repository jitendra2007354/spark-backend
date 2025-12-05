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
exports.sendNotificationToAll = exports.sendNotificationToUserGroup = exports.sendNotificationToUser = void 0;
const notification_model_1 = __importDefault(require("../models/notification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
/**
 * Sends a notification to a specific user.
 * @param userId The ID of the user to notify.
 * @param title The title of the notification.
 * @param message The message content.
 */
const sendNotificationToUser = (userId, title, message) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.default.create({ userId, title, message, type: 'general' });
    // In a real app, you would use a push notification service (like Firebase Cloud Messaging)
    console.log(`LOG: Notification sent to user ${userId}: ${title}`);
    return notification;
});
exports.sendNotificationToUser = sendNotificationToUser;
/**
 * Sends a notification to all users of a certain type (customers or drivers).
 * @param userType The type of users to notify ('Customer' | 'Driver').
 * @param title The title of the notification.
 * @param message The message content.
 */
const sendNotificationToUserGroup = (userType, title, message) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield user_model_1.default.findAll({ where: { userType } });
    const notifications = users.map(user => ({ userId: user.id, title, message, type: 'general' }));
    yield notification_model_1.default.bulkCreate(notifications);
    console.log(`LOG: Sent notification to all ${userType}s: ${title}`);
});
exports.sendNotificationToUserGroup = sendNotificationToUserGroup;
/**
 * Sends a notification to all users.
 * @param title The title of the notification.
 * @param message The message content.
 */
const sendNotificationToAll = (title, message) => __awaiter(void 0, void 0, void 0, function* () {
    const users = yield user_model_1.default.findAll();
    const notifications = users.map(user => ({ userId: user.id, title, message, type: 'general' }));
    yield notification_model_1.default.bulkCreate(notifications);
    console.log(`LOG: Sent notification to all users: ${title}`);
});
exports.sendNotificationToAll = sendNotificationToAll;

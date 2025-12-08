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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToAllUsers = exports.sendToGroup = exports.sendToUser = void 0;
const notification_service_1 = require("../services/notification.service");
/**
 * Controller to send a notification to a specific user.
 * Expects { userId: number, title: string, message: string } in the body.
 */
const sendToUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, title, message } = req.body;
        if (!userId || !title || !message) {
            return res.status(400).json({ error: 'Missing required fields: userId, title, message.' });
        }
        // The service expects an array of user IDs for individual targets.
        yield (0, notification_service_1.sendAdminNotification)([userId], { title, message });
        res.status(200).json({ message: 'Notification sent successfully.' });
    }
    catch (error) {
        console.error('Failed to send notification to user:', error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred.' });
        }
    }
});
exports.sendToUser = sendToUser;
/**
 * Controller to send a notification to a group of users (drivers or customers).
 * Expects { userType: 'drivers' | 'customers', title: string, message: string } in the body.
 */
const sendToGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userType, title, message } = req.body;
        if (!userType || !['drivers', 'customers'].includes(userType) || !title || !message) {
            return res.status(400).json({ error: 'Missing or invalid fields. Requires userType (\'drivers\' or \'customers\'), title, and message.' });
        }
        yield (0, notification_service_1.sendAdminNotification)(userType, { title, message });
        res.status(200).json({ message: `Notification sent to all ${userType}.` });
    }
    catch (error) {
        console.error(`Failed to send notification to group ${req.body.userType}:`, error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred.' });
        }
    }
});
exports.sendToGroup = sendToGroup;
/**
 * Controller to send a notification to all users.
 * Expects { title: string, message: string } in the body.
 */
const sendToAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, message } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: 'Missing required fields: title, message.' });
        }
        yield (0, notification_service_1.sendAdminNotification)('all', { title, message });
        res.status(200).json({ message: 'Notification sent to all users.' });
    }
    catch (error) {
        console.error('Failed to send notification to all users:', error);
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'An unknown error occurred.' });
        }
    }
});
exports.sendToAllUsers = sendToAllUsers;

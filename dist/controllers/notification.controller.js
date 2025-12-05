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
const sendToUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, title, message } = req.body;
        yield (0, notification_service_1.sendNotificationToUser)(userId, title, message);
        res.status(200).json({ message: 'Notification sent successfully.' });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
    }
});
exports.sendToUser = sendToUser;
const sendToGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userType, title, message } = req.body;
        yield (0, notification_service_1.sendNotificationToUserGroup)(userType, title, message);
        res.status(200).json({ message: `Notification sent to all ${userType}s.` });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
    }
});
exports.sendToGroup = sendToGroup;
const sendToAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, message } = req.body;
        yield (0, notification_service_1.sendNotificationToAll)(title, message);
        res.status(200).json({ message: 'Notification sent to all users.' });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
    }
});
exports.sendToAllUsers = sendToAllUsers;

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
exports.initScheduler = void 0;
const sequelize_1 = require("sequelize");
const sponsorNotification_model_1 = __importDefault(require("../models/sponsorNotification.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const socket_service_1 = require("../services/socket.service");
const initScheduler = () => {
    console.log('[Scheduler] Notification scheduler started...');
    // Check every 60 seconds
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const now = new Date();
            // Find notifications that are scheduled for the past (due) and haven't been sent
            const dueNotifications = yield sponsorNotification_model_1.default.findAll({
                where: {
                    status: 'scheduled',
                    scheduledFor: {
                        [sequelize_1.Op.lte]: now
                    }
                }
            });
            for (const notification of dueNotifications) {
                const payload = {
                    title: notification.title,
                    message: notification.message,
                    attachments: notification.attachments
                };
                let driverCount = 0;
                let customerCount = 0;
                if (notification.target === 'all' || notification.target === 'drivers') {
                    driverCount = yield user_model_1.default.count({ where: { userType: 'Driver' } });
                    (0, socket_service_1.sendMessageToRoom)('drivers', 'notification', payload);
                }
                if (notification.target === 'all' || notification.target === 'customers') {
                    customerCount = yield user_model_1.default.count({ where: { userType: 'Customer' } });
                    (0, socket_service_1.sendMessageToRoom)('customers', 'notification', payload);
                }
                notification.status = 'sent';
                notification.driverCount = driverCount;
                notification.customerCount = customerCount;
                notification.recipientCount = driverCount + customerCount;
                yield notification.save();
                console.log(`[Scheduler] Processed scheduled notification ID: ${notification.id}`);
            }
        }
        catch (error) {
            console.error('[Scheduler] Error processing scheduled notifications:', error);
        }
    }), 60000);
};
exports.initScheduler = initScheduler;

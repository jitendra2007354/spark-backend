"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.scheduleDriverStatusChecks = exports.scheduleChatCleanup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const chat_model_1 = __importDefault(require("../models/chat.model")); // Corrected from Chat to ChatMessage
const ride_model_1 = __importStar(require("../models/ride.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
const socket_service_1 = require("./socket.service");
/**
 * Schedules a cron job to delete old chat messages from completed rides.
 * The job runs once every day at midnight.
 */
const scheduleChatCleanup = () => {
    node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running scheduled job: Deleting old chat messages...');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        try {
            const oldRides = yield ride_model_1.default.findAll({
                where: {
                    status: { [sequelize_1.Op.in]: [ride_model_1.RideStatus.COMPLETED, ride_model_1.RideStatus.CANCELLED] },
                    updatedAt: { [sequelize_1.Op.lt]: twentyFourHoursAgo },
                },
                attributes: ['id'],
            });
            if (oldRides.length === 0) {
                console.log('No old rides found. Chat cleanup not needed.');
                return;
            }
            const rideIds = oldRides.map(ride => ride.id);
            const result = yield chat_model_1.default.destroy({
                where: {
                    rideId: { [sequelize_1.Op.in]: rideIds },
                },
            });
            console.log(`Successfully deleted ${result} chat messages from ${rideIds.length} old rides.`);
        }
        catch (error) {
            console.error('Error during chat cleanup cron job:', error);
        }
    }));
    console.log('✅ Scheduled daily chat cleanup job.');
};
exports.scheduleChatCleanup = scheduleChatCleanup;
/**
 * Schedules a cron job to block drivers with long-overdue payments.
 * The job runs once every hour.
 */
const scheduleDriverStatusChecks = () => {
    node_cron_1.default.schedule('0 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running scheduled job: Checking for drivers with outstanding balances...');
        try {
            // Enforce strict 24-hour payment window
            const paymentDeadlineHours = 24;
            const deadlineDate = new Date(Date.now() - paymentDeadlineHours * 60 * 60 * 1000);
            // Find drivers who have outstanding fees AND the fee was charged more than 24 hours ago
            const driversToBlock = yield driver_model_1.default.findAll({
                where: {
                    outstandingPlatformFee: { [sequelize_1.Op.gt]: 0 },
                    // Check if the fee was CHARGED (Ride Accepted) more than 24 hours ago.
                    // This timer is independent of when they attempt to pay.
                    lastDailyFeeChargedAt: { [sequelize_1.Op.lt]: deadlineDate }
                },
                include: [{
                        model: user_model_1.default,
                        as: 'user',
                        where: {
                            isBlocked: false,
                        }
                    }]
            });
            for (const driver of driversToBlock) {
                if (driver.user) {
                    yield driver.user.update({ isBlocked: true });
                    console.log(`Auto-blocked driver ${driver.id} (User ${driver.userId}) for non-payment.`);
                    // Notify the driver via WebSocket
                    (0, socket_service_1.sendMessageToUser)(driver.userId, 'account_blocked', { reason: 'Payment overdue: Daily access fee not paid within 24 hours.' });
                }
            }
        }
        catch (error) {
            console.error('Error during driver status check cron job:', error);
        }
    }));
    console.log('✅ Scheduled hourly driver status check job.');
};
exports.scheduleDriverStatusChecks = scheduleDriverStatusChecks;

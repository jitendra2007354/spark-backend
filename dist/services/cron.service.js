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
exports.scheduleDriverStatusChecks = exports.scheduleChatCleanup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const chat_model_1 = __importDefault(require("../models/chat.model")); // Corrected from Chat to ChatMessage
const ride_model_1 = __importDefault(require("../models/ride.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const config_service_1 = require("./config.service");
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
                    status: 'completed',
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
            const config = yield (0, config_service_1.getApplicableConfig)();
            const autoBlockHours = config.autoBlockHours || 72;
            const blockThresholdDate = new Date(Date.now() - autoBlockHours * 60 * 60 * 1000);
            const [updateCount] = yield user_model_1.default.update({ isBlocked: true }, {
                where: {
                    userType: 'Driver',
                    isBlocked: false,
                    outstandingPlatformFee: { [sequelize_1.Op.gt]: 0 }, // Corrected field name
                    lowBalanceSince: {
                        [sequelize_1.Op.ne]: null,
                        [sequelize_1.Op.lt]: blockThresholdDate,
                    },
                },
            });
            if (updateCount > 0) {
                console.log(`Successfully auto-blocked ${updateCount} drivers for non-payment.`);
            }
        }
        catch (error) {
            console.error('Error during driver status check cron job:', error);
        }
    }));
    console.log('✅ Scheduled hourly driver status check job.');
};
exports.scheduleDriverStatusChecks = scheduleDriverStatusChecks;

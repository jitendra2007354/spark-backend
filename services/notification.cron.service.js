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
exports.scheduleSponsorNotificationCleanup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const notification_model_1 = __importDefault(require("../models/notification.model"));
/**
 * Schedules a cron job to clean up old sponsor notifications from user-facing apps.
 * This job runs at 00:00 (UTC) on the 1st day of every month.
 */
const scheduleSponsorNotificationCleanup = () => {
    // Cron schedule for midnight on the 1st day of every month.
    node_cron_1.default.schedule('0 0 1 * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running monthly cleanup of sponsor notifications for user apps...');
        try {
            const result = yield notification_model_1.default.destroy({
                where: {
                    // We'll use the 'offer' type to identify sponsor-sent notifications
                    type: 'offer',
                    // Safety check to only delete notifications older than the current month
                    createdAt: {
                        [sequelize_1.Op.lt]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                    }
                },
            });
            console.log(`✅ Monthly cleanup complete. Deleted ${result} sponsor notifications from user views.`);
        }
        catch (error) {
            console.error('❌ Error during sponsor notification cleanup:', error);
        }
    }), {
        scheduled: true,
        timezone: "UTC"
    });
    console.log('✅ Cron job for sponsor notification cleanup has been scheduled.');
};
exports.scheduleSponsorNotificationCleanup = scheduleSponsorNotificationCleanup;

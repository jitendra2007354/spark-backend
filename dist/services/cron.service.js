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
exports.scheduleChatCleanup = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const chat_model_1 = __importDefault(require("../models/chat.model"));
/**
 * Schedules a cron job to delete old chat messages.
 * The job runs once every day at midnight.
 */
const scheduleChatCleanup = () => {
    node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running scheduled job: Deleting old chat messages...');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        try {
            const result = yield chat_model_1.default.destroy({
                where: {
                    createdAt: {
                        [sequelize_1.Op.lt]: twentyFourHoursAgo,
                    },
                },
            });
            console.log(`Successfully deleted ${result} old chat threads.`);
        }
        catch (error) {
            console.error('Error during chat cleanup cron job:', error);
        }
    }));
    console.log('✅ Scheduled daily chat cleanup job.');
};
exports.scheduleChatCleanup = scheduleChatCleanup;

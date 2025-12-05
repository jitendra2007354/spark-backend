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
exports.scheduleWalletCheck = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const sequelize_1 = require("sequelize");
const user_model_1 = __importDefault(require("../models/user.model"));
const MINIMUM_BALANCE = 500; // Minimum required balance in the wallet
const GRACE_PERIOD_HOURS = 72; // 3 days grace period
/**
 * Schedules a cron job to check for drivers with low wallet balances.
 * Runs every hour.
 */
const scheduleWalletCheck = () => {
    node_cron_1.default.schedule('0 * * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running hourly job: Checking driver wallet balances...');
        try {
            // 1. Find drivers with balance below the minimum
            const lowBalanceDrivers = yield user_model_1.default.findAll({
                where: {
                    userType: 'Driver',
                    walletBalance: {
                        [sequelize_1.Op.lt]: MINIMUM_BALANCE,
                    },
                    isBlocked: false,
                },
            });
            const now = new Date();
            for (const driver of lowBalanceDrivers) {
                if (driver.lowBalanceSince) {
                    // 2. If the grace period has expired, block the driver
                    const gracePeriodEnd = new Date(driver.lowBalanceSince.getTime() + GRACE_PERIOD_HOURS * 60 * 60 * 1000);
                    if (now > gracePeriodEnd) {
                        driver.isBlocked = true;
                        yield driver.save();
                        console.log(`Driver ${driver.id} has been blocked due to prolonged low balance.`);
                        // TODO: Send a notification to the driver
                    }
                }
                else {
                    // 3. If this is the first time the balance is low, set the timestamp
                    driver.lowBalanceSince = now;
                    yield driver.save();
                    console.log(`Driver ${driver.id} has a low balance. Grace period started.`);
                    // TODO: Send a warning notification to the driver
                }
            }
            // 4. Reset the flag for drivers who have recharged their wallet
            yield user_model_1.default.update({ lowBalanceSince: null }, {
                where: {
                    userType: 'Driver',
                    walletBalance: {
                        [sequelize_1.Op.gte]: MINIMUM_BALANCE,
                    },
                    lowBalanceSince: {
                        [sequelize_1.Op.ne]: null, // Only update if the flag was previously set
                    },
                },
            });
        }
        catch (error) {
            console.error('Error during wallet balance check cron job:', error);
        }
    }));
    console.log('✅ Scheduled hourly driver wallet balance check.');
};
exports.scheduleWalletCheck = scheduleWalletCheck;

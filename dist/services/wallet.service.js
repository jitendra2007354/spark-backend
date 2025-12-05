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
exports.topUpWallet = exports.getDriverWalletBalance = exports.checkAndBlockDriversWithLowBalance = exports.updateUserWallet = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const config_service_1 = require("./config.service");
const database_service_1 = __importDefault(require("../services/database.service")); // Fixed import
const sequelize_1 = require("sequelize"); // Import Transaction
/**
 * Adds or removes funds from a driver's wallet.
 * Sets a timestamp if the balance falls below the minimum.
 */
const updateUserWallet = (driverId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    return yield database_service_1.default.transaction((t) => __awaiter(void 0, void 0, void 0, function* () {
        const driver = yield user_model_1.default.findByPk(driverId, { transaction: t, lock: true });
        if (!driver || driver.userType !== 'Driver') {
            throw new Error('Driver not found.');
        }
        const newBalance = driver.walletBalance + amount;
        const config = yield (0, config_service_1.getApplicableConfig)(driver.city || undefined, undefined);
        const minBalance = config.walletMinBalance; // Corrected property name
        driver.walletBalance = newBalance;
        if (newBalance < minBalance) {
            if (!driver.lowBalanceSince) {
                // Set the timestamp only when the balance first drops low
                driver.lowBalanceSince = new Date();
            }
        }
        else {
            // If balance is healthy, clear the timestamp and unblock the user
            driver.lowBalanceSince = null;
            driver.isBlocked = false;
        }
        yield driver.save({ transaction: t });
        console.log(`LOG: Updated wallet for driver ${driverId}. New Balance: ${newBalance}`);
        return driver;
    }));
});
exports.updateUserWallet = updateUserWallet;
/**
 * Background job to check for and block drivers with prolonged low balances.
 */
const checkAndBlockDriversWithLowBalance = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('LOG: Running job to check for drivers with low balance...');
    const globalConfig = yield (0, config_service_1.getApplicableConfig)(undefined, undefined);
    // Assuming a new property `driverBlockingPeriodHours` is added to Config model
    // or a default value is used if not present or directly define it here
    // For now, I'll use a hardcoded value, or you can add it to your Config model and retrieve it.
    const blockingPeriodHours = 24; // Example: block after 24 hours of low balance
    const blockThreshold = new Date();
    blockThreshold.setHours(blockThreshold.getHours() - blockingPeriodHours);
    const driversToBlock = yield user_model_1.default.findAll({
        where: {
            userType: 'Driver',
            isBlocked: false,
            lowBalanceSince: { [sequelize_1.Op.ne]: null, [sequelize_1.Op.lt]: blockThreshold },
        },
    });
    if (driversToBlock.length === 0) {
        console.log('LOG: No drivers to block for low balance.');
        return;
    }
    for (const driver of driversToBlock) {
        driver.isBlocked = true;
        yield driver.save();
        console.log(`LOG: Auto-blocked driver ${driver.id} due to prolonged low wallet balance.`);
        // Here you could also send a notification to the driver
    }
});
exports.checkAndBlockDriversWithLowBalance = checkAndBlockDriversWithLowBalance;
/**
 * Retrieves a driver's wallet balance.
 */
const getDriverWalletBalance = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield user_model_1.default.findByPk(driverId);
    if (!driver || driver.userType !== 'Driver')
        throw new Error('Driver not found.');
    return driver.walletBalance;
});
exports.getDriverWalletBalance = getDriverWalletBalance;
/**
 * Allows a driver to top up their wallet.
 */
const topUpWallet = (driverId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    if (amount <= 0)
        throw new Error('Top-up amount must be positive.');
    return yield (0, exports.updateUserWallet)(driverId, amount);
});
exports.topUpWallet = topUpWallet;

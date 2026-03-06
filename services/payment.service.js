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
exports.processDailyFee = exports.processMockPayment = void 0;
const driver_model_1 = __importDefault(require("../models/driver.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const socket_service_1 = require("./socket.service");
const database_service_1 = __importDefault(require("./database.service"));
const config_service_1 = require("./config.service");
/**
 * Simulates processing a payment and updates the driver's outstanding balance.
 * In a real app, this would integrate with a payment gateway like Stripe or Razorpay.
 */
const processMockPayment = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const transaction = yield database_service_1.default.transaction();
    let unblocked = false;
    try {
        const driver = yield driver_model_1.default.findOne({
            where: { userId },
            include: [{ model: user_model_1.default, as: 'user' }],
            transaction
        });
        if (!driver) {
            yield transaction.rollback();
            return { success: false, message: "Driver not found." };
        }
        const outstandingFee = driver.outstandingPlatformFee || 0;
        if (outstandingFee < amount) {
            // This could be a feature or a bug, depending on product requirements.
            // For now, we allow overpayment and set the balance to 0.
            console.warn(`Driver ${driver.id} paid ${amount}, but only owed ${outstandingFee}.`);
        }
        // Simulate a successful payment transaction
        console.log(`Mock payment of ${amount} for Driver ${driver.id} was successful.`);
        // Update the driver's balance
        const newBalance = Math.max(0, outstandingFee - amount);
        const updateData = { outstandingPlatformFee: newBalance };
        // If balance is cleared, reset the access expiry so the next ride starts a new 24h cycle
        if (newBalance === 0) {
            updateData.platformAccessExpiry = null;
        }
        yield driver.update(updateData, { transaction });
        // Unblock the user if they have cleared their dues
        if (newBalance <= 0 && ((_a = driver.user) === null || _a === void 0 ? void 0 : _a.isBlocked)) {
            yield driver.user.update({ isBlocked: false }, { transaction });
            unblocked = true;
        }
        yield transaction.commit();
        if (unblocked) {
            (0, socket_service_1.sendMessageToUser)(userId, 'account_unblocked', { reason: 'Payment received. Account reinstated.' });
        }
        return { success: true, message: "Payment processed successfully." };
    }
    catch (error) {
        yield transaction.rollback();
        console.error("Mock Payment Service Error:", error);
        return { success: false, message: "An internal error occurred." };
    }
});
exports.processMockPayment = processMockPayment;
/**
 * Helper to charge a fixed daily fee if the driver hasn't paid in the last 24 hours.
 */
const processDailyFee = (driverId, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.default.findByPk(driverId, { transaction });
    if (!driver)
        return { charged: false, amount: 0 };
    const now = new Date();
    // 'lastDailyFeeChargedAt' tracks when the 24-hour access window started (Ride Acceptance Time).
    // If not, you must add this column to your database schema.
    const lastCharged = driver.lastDailyFeeChargedAt;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (!lastCharged || (now.getTime() - new Date(lastCharged).getTime() > twentyFourHours)) {
        const config = yield (0, config_service_1.getApplicableConfig)(undefined, driver.vehicleType);
        const dailyFee = config.dailyAccessFee || 50; // Default fee if not in config
        const expiryDate = new Date(now.getTime() + twentyFourHours);
        // Update driver
        driver.lastDailyFeeChargedAt = now;
        driver.platformAccessExpiry = expiryDate; // Set the expiry time
        driver.outstandingPlatformFee = (driver.outstandingPlatformFee || 0) + dailyFee;
        yield driver.save({ transaction });
        return { charged: true, amount: dailyFee };
    }
    return { charged: false, amount: 0 };
});
exports.processDailyFee = processDailyFee;

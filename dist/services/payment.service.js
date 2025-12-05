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
exports.processMockPayment = void 0;
const driver_model_1 = __importDefault(require("../models/driver.model"));
/**
 * Simulates processing a payment and updates the driver's outstanding balance.
 * In a real app, this would integrate with a payment gateway like Stripe or Razorpay.
 */
const processMockPayment = (driverId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const driver = yield driver_model_1.default.findByPk(driverId);
        if (!driver) {
            return { success: false, message: "Driver not found." };
        }
        const outstandingFee = driver.outstandingPlatformFee || 0;
        if (outstandingFee < amount) {
            // This could be a feature or a bug, depending on product requirements.
            // For now, we allow overpayment and set the balance to 0.
            console.warn(`Driver ${driverId} paid ${amount}, but only owed ${outstandingFee}.`);
        }
        // Simulate a successful payment transaction
        console.log(`Mock payment of ${amount} for Driver ${driverId} was successful.`);
        // Update the driver's balance
        const newBalance = Math.max(0, outstandingFee - amount);
        yield driver.update({ outstandingPlatformFee: newBalance });
        return { success: true, message: "Payment processed successfully." };
    }
    catch (error) {
        console.error("Mock Payment Service Error:", error);
        return { success: false, message: "An internal error occurred." };
    }
});
exports.processMockPayment = processMockPayment;

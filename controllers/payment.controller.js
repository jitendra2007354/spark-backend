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
exports.makePayment = void 0;
const payment_service_1 = require("../services/payment.service");
const driver_service_1 = require("../services/driver.service");
/**
 * Handles the mock payment request from a driver.
 */
const makePayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const driverId = req.user.id; // Assuming auth middleware provides the user
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid payment amount.' });
    }
    try {
        const paymentResult = yield (0, payment_service_1.processMockPayment)(driverId, amount);
        if (paymentResult.success) {
            // If payment is successful, unblock the driver
            yield (0, driver_service_1.unblockDriver)(driverId);
            res.status(200).json({ success: true, message: 'Payment successful and driver unblocked.' });
        }
        else {
            res.status(400).json({ success: false, message: paymentResult.message });
        }
    }
    catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ success: false, message: 'An internal error occurred during payment processing.' });
    }
});
exports.makePayment = makePayment;

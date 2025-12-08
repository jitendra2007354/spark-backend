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
exports.applyPenaltyToUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
/**
 * Applies a penalty to a user's outstanding balance.
 * This works for both Customers (Users) and Drivers.
 * @param userId - The ID of the user to penalize.
 * @param amount - The amount to add to their outstanding balance.
 */
const applyPenaltyToUser = (userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // First, try to find a Driver
        const driver = yield driver_model_1.default.findByPk(userId);
        if (driver) {
            const newBalance = (driver.outstandingPlatformFee || 0) + amount;
            yield driver.update({ outstandingPlatformFee: newBalance });
            console.log(`Applied penalty of ${amount} to Driver ${userId}. New balance: ${newBalance}`);
            return;
        }
        // If not a driver, try to find a Customer (User)
        const user = yield user_model_1.default.findByPk(userId);
        if (user) {
            const newBalance = (user.outstandingPlatformFee || 0) + amount;
            yield user.update({ outstandingPlatformFee: newBalance });
            console.log(`Applied penalty of ${amount} to Customer ${userId}. New balance: ${newBalance}`);
            return;
        }
        console.warn(`Could not find user or driver with ID ${userId} to apply penalty.`);
    }
    catch (error) {
        console.error(`Error applying penalty to user ${userId}:`, error);
    }
});
exports.applyPenaltyToUser = applyPenaltyToUser;

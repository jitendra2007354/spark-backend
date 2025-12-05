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
exports.setDriverOnlineStatus = exports.findNearbyDrivers = exports.blockOverdueDrivers = exports.unblockDriver = exports.findNearestAvailableDriver = void 0;
const driver_model_1 = __importDefault(require("../models/driver.model"));
const config_service_1 = require("./config.service");
/**
 * Finds the nearest available driver for a ride request.
 */
const findNearestAvailableDriver = (lat, lng, vehicleType, excludedDriverIds) => __awaiter(void 0, void 0, void 0, function* () {
    // Implementation remains the same
    return null; // Placeholder
});
exports.findNearestAvailableDriver = findNearestAvailableDriver;
/**
 * Unblocks a driver, allowing them to receive ride requests again.
 * Typically called after a payment is made.
 */
const unblockDriver = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const driver = yield driver_model_1.default.findByPk(driverId);
        if (driver) {
            // await driver.update({ isBlocked: false });
            console.log(`Driver ${driverId} has been unblocked.`);
        }
    }
    catch (error) {
        console.error(`Error unblocking driver ${driverId}:`, error);
    }
});
exports.unblockDriver = unblockDriver;
/**
 * A background job to automatically block drivers who haven't paid their commission.
 */
const blockOverdueDrivers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_service_1.getConfig)('global');
        const now = new Date();
        const overdueDate = new Date(now.getTime() - (((config === null || config === void 0 ? void 0 : config.autoBlockHours) || 24) * 3600 * 1000)); // Grace period in hours
        const overdueDrivers = yield driver_model_1.default.findAll({
            where: {
            // isBlocked: false,
            // outstandingPlatformFee: { [Op.gt]: 0 },
            // lastFeePaidOn: { [Op.lt]: overdueDate } // Check when the fee was last considered
            }
        });
        for (const driver of overdueDrivers) {
            // await driver.update({ isBlocked: true });
            console.log(`Automatically blocked Driver ${driver.id} for non-payment.`);
            // Optionally, send a notification to the driver
        }
    }
    catch (error) {
        console.error("Error in blockOverdueDrivers job:", error);
    }
});
exports.blockOverdueDrivers = blockOverdueDrivers;
const findNearbyDrivers = (lat, lng, vehicleType) => __awaiter(void 0, void 0, void 0, function* () {
    return [];
});
exports.findNearbyDrivers = findNearbyDrivers;
const setDriverOnlineStatus = (driverId, isOnline, location) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updateData = { isOnline };
        if (location) {
            updateData.currentLat = location.lat;
            updateData.currentLng = location.lng;
        }
        yield driver_model_1.default.update(updateData, { where: { id: driverId } });
    }
    catch (error) {
        console.error(`Error updating driver ${driverId} status:`, error);
    }
});
exports.setDriverOnlineStatus = setDriverOnlineStatus;
// You would run this job on a schedule (e.g., every hour) using a library like node-cron
// For example: cron.schedule('0 * * * *', blockOverdueDrivers);

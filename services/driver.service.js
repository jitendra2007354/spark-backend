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
exports.setDriverOnlineStatus = exports.findNearbyDrivers = exports.blockOverdueDrivers = exports.unblockDriver = exports.blockDriver = exports.findNearestAvailableDriver = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
const config_service_1 = require("./config.service");
const sequelize_1 = require("sequelize");
const socket_service_1 = require("./socket.service");
const location_service_1 = require("./location.service");
/**
 * Finds the nearest available and verified driver for a ride request.
 */
const findNearestAvailableDriver = (lat, lng, vehicleType, excludedDriverIds) => __awaiter(void 0, void 0, void 0, function* () {
    // Delegate to the location service which uses PostGIS/Spatial queries on DriverLocation
    return yield (0, location_service_1.findNearestAvailableDriver)(lat, lng, vehicleType, excludedDriverIds);
});
exports.findNearestAvailableDriver = findNearestAvailableDriver;
/**
 * Blocks a driver, preventing them from receiving ride requests.
 * CORRECTED: This function now accepts a userId.
 */
const blockDriver = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findByPk(userId);
        if (user && user.userType === 'Driver') {
            yield user.update({ isBlocked: true });
            (0, socket_service_1.sendMessageToUser)(userId, 'account_blocked', { reason: 'Your account has been blocked by an administrator.' });
            console.log(`Driver associated with user ${userId} has been blocked.`);
        }
    }
    catch (error) {
        console.error(`Error blocking driver for user ${userId}:`, error);
    }
});
exports.blockDriver = blockDriver;
/**
 * Unblocks a driver, allowing them to receive ride requests again.
 * CORRECTED: This function now accepts a userId instead of a driverId.
 */
const unblockDriver = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findByPk(userId);
        if (user && user.userType === 'Driver') {
            yield user.update({ isBlocked: false, lowBalanceSince: null });
            (0, socket_service_1.sendMessageToUser)(userId, 'account_unblocked', { reason: 'Your account has been reinstated.' });
            console.log(`Driver associated with user ${userId} has been unblocked.`);
        }
    }
    catch (error) {
        console.error(`Error unblocking driver for user ${userId}:`, error);
    }
});
exports.unblockDriver = unblockDriver;
/**
 * A background job to automatically block drivers who have a low wallet balance for too long.
 */
const blockOverdueDrivers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, config_service_1.getConfig)('global');
        const now = new Date();
        const gracePeriodHours = (config === null || config === void 0 ? void 0 : config.autoBlockHours) || 24;
        const thresholdDate = new Date(now.getTime() - (gracePeriodHours * 3600 * 1000));
        const overdueDrivers = yield user_model_1.default.findAll({
            where: {
                userType: 'Driver',
                isBlocked: false,
                walletBalance: { [sequelize_1.Op.lt]: (config === null || config === void 0 ? void 0 : config.walletMinBalance) || 0 }, // Below min balance
                lowBalanceSince: { [sequelize_1.Op.lt]: thresholdDate } // For longer than the grace period
            }
        });
        for (const driver of overdueDrivers) {
            yield driver.update({ isBlocked: true });
            console.log(`Automatically blocked Driver ${driver.id} for low balance.`);
            (0, socket_service_1.sendMessageToUser)(driver.id, 'account_blocked', { reason: 'Low wallet balance.' });
        }
    }
    catch (error) {
        console.error("Error in blockOverdueDrivers job:", error);
    }
});
exports.blockOverdueDrivers = blockOverdueDrivers;
/**
 * Finds all available drivers within a certain radius.
 */
const findNearbyDrivers = (lat, lng, vehicleType) => __awaiter(void 0, void 0, void 0, function* () {
    // Delegate to location service
    return yield (0, location_service_1.findAllNearbyDrivers)(lat, lng, 5, vehicleType);
});
exports.findNearbyDrivers = findNearbyDrivers;
/**
 * Updates a driver's online status and location.
 */
const setDriverOnlineStatus = (userId, isOnline, location) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.default.findByPk(userId);
        if (user && user.userType === 'Driver') {
            yield user.update({ isOnline });
            // If going online and location is provided, update the spatial table
            if (isOnline && location) {
                const driver = yield driver_model_1.default.findOne({ where: { userId } });
                if (driver) {
                    yield (0, location_service_1.updateDriverLocation)(driver.id, location.lat, location.lng);
                }
            }
            // Note: We don't remove location when going offline immediately to allow for "last known location" features,
            // but the websocket disconnect handler does clean it up.
        }
    }
    catch (error) {
        console.error(`Error updating driver status for user ${userId}:`, error);
    }
});
exports.setDriverOnlineStatus = setDriverOnlineStatus;

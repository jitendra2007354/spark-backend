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
const config_service_1 = require("./config.service");
const sequelize_1 = require("sequelize");
const websocket_service_1 = require("./websocket.service");
/**
 * Finds the nearest available and verified driver for a ride request.
 */
const findNearestAvailableDriver = (lat, lng, vehicleType, excludedDriverIds) => __awaiter(void 0, void 0, void 0, function* () {
    const config = yield (0, config_service_1.getConfig)('global');
    const radius = (config === null || config === void 0 ? void 0 : config.driverSearchRadius) || 5; // Search radius in kilometers
    const drivers = yield user_model_1.default.findAll({
        where: {
            userType: 'Driver',
            isOnline: true,
            isBlocked: false,
            licenseIsVerified: true, // Ensure driver is verified
            rcIsVerified: true,
            id: { [sequelize_1.Op.notIn]: excludedDriverIds },
            // A basic bounding box query for location
            currentLat: {
                [sequelize_1.Op.between]: [lat - (radius / 111), lat + (radius / 111)],
            },
            currentLng: {
                [sequelize_1.Op.between]: [lng - (radius / (111 * Math.cos(lat * (Math.PI / 180)))), lng + (radius / (111 * Math.cos(lat * (Math.PI / 180))))],
            },
        },
        attributes: {
            include: [
                // Calculate distance using Haversine formula
                [sequelize_1.Sequelize.literal(`6371 * acos(cos(radians(${lat})) * cos(radians(currentLat)) * cos(radians(currentLng) - radians(${lng})) + sin(radians(${lat})) * sin(radians(currentLat)))`), 'distance'],
            ],
        },
        order: sequelize_1.Sequelize.col('distance'),
        limit: 1,
    });
    return drivers.length > 0 ? drivers[0] : null;
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
            (0, websocket_service_1.sendMessageToUser)(userId, 'account_blocked', { reason: 'Your account has been blocked by an administrator.' });
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
            (0, websocket_service_1.sendMessageToUser)(userId, 'account_unblocked', { reason: 'Your account has been reinstated.' });
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
            (0, websocket_service_1.sendMessageToUser)(driver.id, 'account_blocked', { reason: 'Low wallet balance.' });
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
    const config = yield (0, config_service_1.getConfig)('global');
    const radius = (config === null || config === void 0 ? void 0 : config.driverSearchRadius) || 5; // Search radius in kilometers
    const drivers = yield user_model_1.default.findAll({
        where: {
            userType: 'Driver',
            isOnline: true,
            isBlocked: false,
            // Basic bounding box for location
            currentLat: {
                [sequelize_1.Op.between]: [lat - (radius / 111), lat + (radius / 111)],
            },
            currentLng: {
                [sequelize_1.Op.between]: [lng - (radius / (111 * Math.cos(lat * (Math.PI / 180)))), lng + (radius / (111 * Math.cos(lat * (Math.PI / 180))))],
            },
        },
    });
    return drivers;
});
exports.findNearbyDrivers = findNearbyDrivers;
/**
 * Updates a driver's online status and location.
 */
const setDriverOnlineStatus = (driverId, isOnline, location) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const driver = yield user_model_1.default.findByPk(driverId);
        if (driver && driver.userType === 'Driver') {
            const updateData = { isOnline };
            if (location) {
                updateData.currentLat = location.lat;
                updateData.currentLng = location.lng;
            }
            yield driver.update(updateData);
        }
    }
    catch (error) {
        console.error(`Error updating driver ${driverId} status:`, error);
    }
});
exports.setDriverOnlineStatus = setDriverOnlineStatus;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getDriverRideHistory = exports.getCustomerRideHistory = exports.updateRideStatus = exports.confirmRide = exports.getRideById = exports.createRide = void 0;
const ride_model_1 = __importStar(require("../models/ride.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const database_service_1 = __importDefault(require("./database.service"));
const socket_service_1 = require("./socket.service");
// This was the source of a build error and has been corrected to use the RideStatus enum.
const validTransitions = {
    [ride_model_1.RideStatus.ACCEPTED]: [ride_model_1.RideStatus.ARRIVED],
    [ride_model_1.RideStatus.ARRIVED]: [ride_model_1.RideStatus.IN_PROGRESS],
    [ride_model_1.RideStatus.IN_PROGRESS]: [ride_model_1.RideStatus.COMPLETED],
};
const createRide = (rideData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const ride = yield ride_model_1.default.create(rideData);
    // Broadcast to nearby drivers
    // We use dynamic imports here to avoid circular dependencies with websocket.service and location.service
    const { findNearbyAvailableDrivers } = yield Promise.resolve().then(() => __importStar(require('./location.service')));
    const lat = ((_a = ride.pickupLocation) === null || _a === void 0 ? void 0 : _a.lat) || ((_b = ride.pickupLocation) === null || _b === void 0 ? void 0 : _b.latitude);
    const lng = ((_c = ride.pickupLocation) === null || _c === void 0 ? void 0 : _c.lng) || ((_d = ride.pickupLocation) === null || _d === void 0 ? void 0 : _d.longitude);
    if (lat && lng) {
        const drivers = yield findNearbyAvailableDrivers(lat, lng, ride.vehicleType);
        drivers.forEach(driver => {
            (0, socket_service_1.sendMessageToUser)(driver.userId, 'new_ride_request', { ride });
        });
    }
    return ride;
});
exports.createRide = createRide;
/**
 * Retrieves a ride by its ID.
 * @param rideId - The ID of the ride.
 */
const getRideById = (rideId) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.default.findByPk(rideId);
    return ride;
});
exports.getRideById = getRideById;
/**
 * Confirms a ride, and notifies the driver.
 * This function was corrected to use the proper RideStatus enum.
 * @param rideId The ID of the ride to confirm.
 * @param customerId The ID of the customer confirming the ride.
 */
const confirmRide = (rideId, customerId) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.default.findByPk(rideId, {
        include: [{
                model: driver_model_1.default,
                as: 'driver',
                include: [{ model: user_model_1.default, as: 'user', attributes: ['firstName', 'lastName', 'phoneNumber', 'pfp'] }]
            }]
    });
    if (!ride) {
        throw new Error('Ride not found');
    }
    if (ride.customerId !== customerId) {
        throw new Error('You are not authorized to confirm this ride.');
    }
    // A ride can only be confirmed if a driver has already accepted it.
    // This was corrected to use the RideStatus enum instead of a string.
    if (ride.status !== ride_model_1.RideStatus.ACCEPTED) {
        throw new Error('Ride cannot be confirmed in its current state.');
    }
    const { getDriverLocation } = yield Promise.resolve().then(() => __importStar(require('./location.service')));
    let driverCoords = { lat: 0, lng: 0 };
    if (ride.driverId) {
        const loc = yield getDriverLocation(ride.driverId);
        if (loc)
            driverCoords = loc;
    }
    // Notify the assigned driver that the ride is confirmed
    if (ride.driverId) {
        const driver = yield driver_model_1.default.findByPk(ride.driverId);
        if (driver) {
            (0, socket_service_1.sendMessageToUser)(driver.userId, 'ride_confirmed', {
                rideId: ride.id,
                message: 'The customer has confirmed the ride. Please proceed to the pickup location.',
            });
        }
    }
    return Object.assign(Object.assign({}, ride.toJSON()), { driverCoords });
});
exports.confirmRide = confirmRide;
/**
 * Updates the status of a ride and notifies the customer.
 * This function enforces a valid ride lifecycle.
 * @param rideId The ID of the ride to update.
 * @param userId The ID of the user (driver) initiating the update.
 * @param newStatus The new status to set.
 */
const updateRideStatus = (rideId, userId, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield database_service_1.default.transaction();
    try {
        const ride = yield ride_model_1.default.findByPk(rideId, { transaction });
        if (!ride) {
            throw new Error('Ride not found');
        }
        const driver = yield driver_model_1.default.findOne({
            where: { userId },
            include: [{ model: user_model_1.default, as: 'user' }],
            transaction
        });
        if (!driver) {
            throw new Error('Driver profile not found');
        }
        // 1. Authorization: Only the assigned driver can update the status.
        if (ride.driverId !== driver.id) {
            throw new Error('You are not authorized to update this ride.');
        }
        // 2. State Validation: Ensure the new status is a valid transition.
        const allowedTransitions = validTransitions[ride.status];
        if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
            throw new Error(`Invalid status transition from ${ride.status} to ${newStatus}.`);
        }
        // 3. Update Status: Set the new status and save the ride.
        ride.status = newStatus;
        yield ride.save({ transaction });
        // 4. Update Driver Stats if Completed
        if (newStatus === ride_model_1.RideStatus.COMPLETED && driver.user) {
            driver.user.totalRides = (driver.user.totalRides || 0) + 1;
            driver.user.totalEarnings = (Number(driver.user.totalEarnings) || 0) + (Number(ride.fare) || 0);
            yield driver.user.save({ transaction });
        }
        yield transaction.commit();
        // 5. Notify Customer (Post-commit)
        if (newStatus === ride_model_1.RideStatus.COMPLETED) {
            (0, socket_service_1.sendMessageToUser)(ride.customerId, 'ride_completed', { rideId: ride.id, fare: ride.fare });
        }
        else {
            (0, socket_service_1.sendMessageToUser)(ride.customerId, 'ride_status_updated', {
                rideId: ride.id,
                status: newStatus,
                message: `Your ride is now ${newStatus}.`
            });
        }
        return ride;
    }
    catch (error) {
        yield transaction.rollback();
        throw error;
    }
});
exports.updateRideStatus = updateRideStatus;
/**
 * Retrieves the ride history for a specific customer.
 * @param customerId - The ID of the customer.
 */
const getCustomerRideHistory = (customerId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ride_model_1.default.findAll({ where: { customerId }, order: [['createdAt', 'DESC']] });
});
exports.getCustomerRideHistory = getCustomerRideHistory;
/**
 * Retrieves the ride history for a specific driver.
 * @param userId - The ID of the user who is a driver.
 */
const getDriverRideHistory = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.default.findOne({ where: { userId } });
    if (!driver) {
        // Return empty array if no driver profile found for the user, to avoid errors.
        return [];
    }
    return yield ride_model_1.default.findAll({ where: { driverId: driver.id }, order: [['createdAt', 'DESC']] });
});
exports.getDriverRideHistory = getDriverRideHistory;

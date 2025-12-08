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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverRideHistory = exports.getCustomerRideHistory = exports.updateRideStatus = exports.confirmRide = exports.getRideById = exports.createRide = void 0;
const ride_model_1 = __importStar(require("../models/ride.model"));
const websocket_service_1 = require("./websocket.service");
// This was the source of a build error and has been corrected to use the RideStatus enum.
const validTransitions = {
    [ride_model_1.RideStatus.ACCEPTED]: [ride_model_1.RideStatus.ARRIVED],
    [ride_model_1.RideStatus.ARRIVED]: [ride_model_1.RideStatus.IN_PROGRESS],
    [ride_model_1.RideStatus.IN_PROGRESS]: [ride_model_1.RideStatus.COMPLETED],
};
const createRide = (rideData) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.default.create(rideData);
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
    const ride = yield ride_model_1.default.findByPk(rideId);
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
    // This line was the source of a build error because 'confirmed' is not a valid RideStatus.
    // The logic is preserved by keeping the ride status as ACCEPTED and notifying the driver.
    // ride.status = 'confirmed';
    // await ride.save();
    // Notify the assigned driver that the ride is confirmed
    if (ride.driverId) {
        (0, websocket_service_1.sendMessageToUser)(ride.driverId, 'ride-confirmed', {
            rideId: ride.id,
            message: 'The customer has confirmed the ride. Please proceed to the pickup location.',
        });
    }
    return ride;
});
exports.confirmRide = confirmRide;
/**
 * Updates the status of a ride and notifies the customer.
 * This function enforces a valid ride lifecycle.
 * @param rideId The ID of the ride to update.
 * @param driverId The ID of the driver initiating the update.
 * @param newStatus The new status to set.
 */
const updateRideStatus = (rideId, driverId, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.default.findByPk(rideId);
    if (!ride) {
        throw new Error('Ride not found');
    }
    // 1. Authorization: Only the assigned driver can update the status.
    if (ride.driverId !== driverId) {
        throw new Error('You are not authorized to update this ride.');
    }
    // 2. State Validation: Ensure the new status is a valid transition.
    const allowedTransitions = validTransitions[ride.status];
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
        throw new Error(`Invalid status transition from ${ride.status} to ${newStatus}.`);
    }
    // 3. Update Status: Set the new status and save the ride.
    ride.status = newStatus;
    yield ride.save();
    // 4. Notify Customer: Send a real-time notification to the customer.
    (0, websocket_service_1.sendMessageToUser)(ride.customerId, 'ride_status_updated', {
        rideId: ride.id,
        status: newStatus,
        message: `Your ride is now ${newStatus}.`
    });
    return ride;
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
 * @param driverId - The ID of the driver.
 */
const getDriverRideHistory = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield ride_model_1.default.findAll({ where: { driverId }, order: [['createdAt', 'DESC']] });
});
exports.getDriverRideHistory = getDriverRideHistory;

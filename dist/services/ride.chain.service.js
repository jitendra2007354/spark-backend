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
exports.handleRideCancellation = exports.handleDriverReject = exports.handleDriverAccept = exports.processRideChain = void 0;
const driver_service_1 = require("./driver.service");
const ride_service_1 = require("./ride.service");
const ride_model_1 = __importDefault(require("../models/ride.model"));
const config_service_1 = require("./config.service");
// The core logic that moves a ride through its lifecycle
const processRideChain = (rideId) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.default.findByPk(rideId);
    if (!ride || ride.status !== 'searching')
        return;
    const excludedDriverIds = ride.rejectedBy ? ride.rejectedBy.split(',').map((id) => parseInt(id, 10)) : [];
    // 1. Find the nearest available driver
    const nearestDriver = yield (0, driver_service_1.findNearestAvailableDriver)(ride.pickupLocation.latitude, ride.pickupLocation.longitude, ride.vehicleType, excludedDriverIds);
    if (nearestDriver) {
        console.log(`Ride ${rideId}: Found potential driver ${nearestDriver.id}. Notifying...`);
        // TODO: Notify driver (this would be a push notification in a real app)
        // We'll simulate the driver accepting for now
        setTimeout(() => (0, exports.handleDriverAccept)(rideId, nearestDriver.id), 5000); // 5s accept timer
    }
    else {
        console.log(`Ride ${rideId}: No available drivers found.`);
        yield (0, ride_service_1.updateRideStatus)(rideId, 'no_drivers');
    }
});
exports.processRideChain = processRideChain;
const handleDriverAccept = (rideId, driverId) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.default.findByPk(rideId);
    // Ensure the ride is still searching
    if (!ride || ride.status !== 'searching')
        return;
    try {
        // Attempt to confirm the ride
        const success = yield (0, ride_service_1.updateRideStatus)(rideId, 'confirmed', driverId);
        if (success) {
            console.log(`Ride ${rideId}: Confirmed by driver ${driverId}.`);
            // TODO: Notify customer that a driver is on the way
        }
        else {
            console.log(`Ride ${rideId}: Race condition - ride was already taken. Driver ${driverId} is free again.`);
            // This driver is now free, maybe trigger a search for them for another ride
        }
    }
    catch (error) {
        console.error(`Error confirming ride ${rideId} for driver ${driverId}:`, error);
    }
});
exports.handleDriverAccept = handleDriverAccept;
const handleDriverReject = (rideId, driverId) => __awaiter(void 0, void 0, void 0, function* () {
    // Implementation for when a driver explicitly rejects the ride notification
});
exports.handleDriverReject = handleDriverReject;
const handleRideCancellation = (rideId) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.default.findByPk(rideId);
    if (!ride || ride.status === 'completed' || ride.status === 'cancelled')
        return;
    const config = yield (0, config_service_1.getConfig)('global');
    let finalStatus = 'cancelled';
    // Check for cancellation penalty
    if (ride.status === 'confirmed') {
        const timeSinceConfirmation = (new Date().getTime() - ride.updatedAt.getTime()) / 1000; // in seconds
        if (timeSinceConfirmation > ((config === null || config === void 0 ? void 0 : config.cancellationGracePeriod) || 60)) {
            finalStatus = 'cancelled_with_penalty';
            // TODO: Apply penalty fee to the user
            console.log(`Ride ${rideId}: Cancelled by user with a penalty.`);
        }
    }
    yield (0, ride_service_1.updateRideStatus)(rideId, finalStatus);
    console.log(`Ride ${rideId}: Cancelled.`);
    // TODO: Notify the other party (driver or customer)
});
exports.handleRideCancellation = handleRideCancellation;

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
exports.startRideAssignment = startRideAssignment;
exports.handleDriverAccept = handleDriverAccept;
exports.handleDriverReject = handleDriverReject;
exports.handleRideCancellation = handleRideCancellation;
exports.handleRideCompletion = handleRideCompletion;
const ride_model_1 = __importStar(require("../models/ride.model"));
const location_service_1 = require("./location.service");
const config_service_1 = require("./config.service");
const user_model_1 = __importDefault(require("../models/user.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
const database_service_1 = __importDefault(require("./database.service"));
const payment_service_1 = require("./payment.service");
const socket_service_1 = require("./socket.service");
const offerTimers = new Map();
function handleOfferExpiration(rideId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride || ride.status !== ride_model_1.RideStatus.ASSIGNING || !ride.offerExpiresAt || new Date() < ride.offerExpiresAt) {
            return;
        }
        console.log(`Offer for ride ${rideId} to driver ${ride.currentDriverId} has expired.`);
        const driverId = ride.currentDriverId;
        const currentRejected = ride.rejectedDriverIds || [];
        yield ride.update({
            status: ride_model_1.RideStatus.PENDING,
            rejectedDriverIds: [...currentRejected, driverId],
            currentDriverId: null,
            offerExpiresAt: null
        });
        findAndOfferToNextDriver(rideId);
    });
}
function findAndOfferToNextDriver(rideId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride || ride.status !== ride_model_1.RideStatus.PENDING) {
            console.log(`Assignment chain for ride ${rideId} stopped. Status: ${ride === null || ride === void 0 ? void 0 : ride.status}`);
            return;
        }
        const rejectedDrivers = ride.rejectedDriverIds || [];
        const nextDriver = yield (0, location_service_1.findNearestAvailableDriver)(ride.pickupLocation.latitude, ride.pickupLocation.longitude, ride.vehicleType, rejectedDrivers);
        if (nextDriver) {
            console.log(`Offering ride ${rideId} to driver ${nextDriver.id}`);
            const config = yield (0, config_service_1.getApplicableConfig)();
            const offerExpiresAt = new Date(Date.now() + config.rideAcceptTime * 1000);
            yield ride.update({
                status: ride_model_1.RideStatus.ASSIGNING,
                currentDriverId: nextDriver.id,
                offerExpiresAt: offerExpiresAt,
            });
            (0, socket_service_1.sendMessageToUser)(nextDriver.userId, 'new_ride_offer', { rideId: ride.id, details: ride, timeout: config.rideAcceptTime });
            const timer = setTimeout(() => handleOfferExpiration(ride.id), config.rideAcceptTime * 1000);
            offerTimers.set(ride.id, timer);
        }
        else {
            console.log(`No available drivers for ride ${rideId}.`);
            yield ride.update({ status: ride_model_1.RideStatus.CANCELLED });
            (0, socket_service_1.sendMessageToUser)(ride.customerId, 'ride_update', { rideId: ride.id, status: ride_model_1.RideStatus.CANCELLED, message: 'No available drivers found.' });
        }
    });
}
function startRideAssignment(rideId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride)
            return;
        yield findAndOfferToNextDriver(rideId);
    });
}
function handleDriverAccept(rideId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const transaction = yield database_service_1.default.transaction();
        let feeCharged = { charged: false, amount: 0 };
        try {
            const driver = yield driver_model_1.default.findOne({ where: { userId }, transaction });
            if (!driver) {
                yield transaction.rollback();
                return;
            }
            const ride = yield ride_model_1.default.findByPk(rideId, { transaction });
            // This was the source of a build error. Added a check for ride.offerExpiresAt.
            if (!ride || ride.status !== ride_model_1.RideStatus.ASSIGNING || ride.currentDriverId !== driver.id || !ride.offerExpiresAt || new Date() > ride.offerExpiresAt) {
                yield transaction.rollback();
                (0, socket_service_1.sendMessageToUser)(userId, 'offer_expired', { rideId });
                return;
            }
            console.log(`Driver ${driver.id} accepted ride ${rideId}`);
            const timer = offerTimers.get(rideId);
            if (timer) {
                clearTimeout(timer);
                offerTimers.delete(rideId);
            }
            yield ride.update({
                status: ride_model_1.RideStatus.ACCEPTED,
                driverId: driver.id,
                currentDriverId: null,
                offerExpiresAt: null
            }, { transaction });
            // Process Daily Fee
            feeCharged = yield (0, payment_service_1.processDailyFee)(driver.id, transaction);
            yield transaction.commit();
            // After commit, fetch the updated driver to get the new expiry date
            const updatedDriver = yield driver_model_1.default.findByPk(driver.id);
            (0, socket_service_1.sendMessageToUser)(ride.customerId, 'ride_accepted', { rideId, driverId: driver.id, details: ride });
            (0, socket_service_1.sendMessageToUser)(userId, 'ride_confirmed', { rideId, details: ride });
            if (feeCharged.charged && updatedDriver && updatedDriver.platformAccessExpiry) {
                (0, socket_service_1.sendPlatformFeeAccessStarted)(userId, updatedDriver.platformAccessExpiry.toISOString());
            }
        }
        catch (error) {
            yield transaction.rollback();
            console.error(`Error in handleDriverAccept for ride ${rideId}:`, error);
        }
    });
}
function handleDriverReject(rideId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const driver = yield driver_model_1.default.findOne({ where: { userId } });
        if (!driver)
            return;
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride || ride.status !== ride_model_1.RideStatus.ASSIGNING || ride.currentDriverId !== driver.id) {
            return;
        }
        console.log(`Driver ${driver.id} rejected ride ${rideId}`);
        const timer = offerTimers.get(rideId);
        if (timer) {
            clearTimeout(timer);
            offerTimers.delete(rideId);
        }
        const currentRejected = ride.rejectedDriverIds || [];
        yield ride.update({
            status: ride_model_1.RideStatus.PENDING,
            rejectedDriverIds: [...currentRejected, driver.id],
            currentDriverId: null,
            offerExpiresAt: null
        });
        findAndOfferToNextDriver(rideId);
    });
}
function handleRideCancellation(rideId, cancelledBy) {
    return __awaiter(this, void 0, void 0, function* () {
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride || [ride_model_1.RideStatus.CANCELLED, ride_model_1.RideStatus.COMPLETED].includes(ride.status))
            return;
        console.log(`Ride ${rideId} cancelled by ${cancelledBy}`);
        const timer = offerTimers.get(rideId);
        if (timer) {
            clearTimeout(timer);
            offerTimers.delete(rideId);
        }
        if (cancelledBy === 'Driver') {
            // If Driver cancels, we reset the ride to PENDING and re-broadcast it to other drivers.
            console.log(`Driver cancelled ride ${rideId}. Re-opening to pool.`);
            const driverId = ride.driverId || ride.currentDriverId;
            const currentRejected = ride.rejectedDriverIds || [];
            // Add the cancelling driver to rejected list
            let newRejected = [...currentRejected];
            if (driverId && !newRejected.includes(driverId)) {
                newRejected.push(driverId);
            }
            yield ride.update({
                status: ride_model_1.RideStatus.PENDING,
                driverId: null,
                currentDriverId: null,
                rejectedDriverIds: newRejected,
                offerExpiresAt: null
            });
            (0, socket_service_1.sendMessageToUser)(ride.customerId, 'ride_driver_cancelled', {
                rideId,
                message: 'Driver cancelled. Searching for a new driver...'
            });
            // Re-broadcast to nearby drivers
            const lat = ride.pickupLocation.lat || ride.pickupLocation.latitude;
            const lng = ride.pickupLocation.lng || ride.pickupLocation.longitude;
            if (lat && lng) {
                const drivers = yield (0, location_service_1.findNearbyAvailableDrivers)(lat, lng, ride.vehicleType);
                drivers.forEach(d => {
                    if (d.id !== driverId) {
                        (0, socket_service_1.sendMessageToUser)(d.userId, 'new_ride_request', { ride });
                    }
                });
            }
        }
        else {
            // Customer cancelled -> End the ride
            yield ride.update({ status: ride_model_1.RideStatus.CANCELLED });
            (0, socket_service_1.sendMessageToUser)(ride.customerId, 'ride_cancelled', { rideId, cancelledBy });
            if (ride.driverId) {
                const driver = yield driver_model_1.default.findByPk(ride.driverId);
                if (driver)
                    (0, socket_service_1.sendMessageToUser)(driver.userId, 'ride_cancelled', { rideId, cancelledBy });
            }
        }
    });
}
function handleRideCompletion(rideId) {
    return __awaiter(this, void 0, void 0, function* () {
        const transaction = yield database_service_1.default.transaction();
        try {
            const ride = yield ride_model_1.default.findByPk(rideId, {
                include: [{
                        model: driver_model_1.default,
                        as: 'driver',
                        include: [{ model: user_model_1.default, as: 'user' }] // Include User to get city
                    }],
                transaction
            });
            if (!ride || !ride.driver || ![ride_model_1.RideStatus.ACCEPTED, ride_model_1.RideStatus.ARRIVED, ride_model_1.RideStatus.IN_PROGRESS].includes(ride.status)) {
                yield transaction.rollback();
                console.error(`Cannot complete ride ${rideId}. Invalid state.`);
                return;
            }
            yield ride.update({ status: ride_model_1.RideStatus.COMPLETED }, { transaction });
            const driver = ride.driver;
            if (driver && driver.user) {
                driver.user.totalRides = (driver.user.totalRides || 0) + 1;
                driver.user.totalEarnings = (Number(driver.user.totalEarnings) || 0) + (Number(ride.fare) || 0);
                yield driver.user.save({ transaction });
            }
            yield transaction.commit();
            (0, socket_service_1.sendMessageToUser)(ride.customerId, 'ride_completed', { rideId, fare: ride.fare });
            (0, socket_service_1.sendMessageToUser)(driver.userId, 'ride_completed', { rideId, fare: ride.fare });
            console.log(`Ride ${rideId} has been successfully completed.`);
        }
        catch (error) {
            yield transaction.rollback();
            console.error(`Error completing ride ${rideId}:`, error);
        }
    });
}

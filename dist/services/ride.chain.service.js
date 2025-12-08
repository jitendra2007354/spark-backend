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
const websocket_service_1 = require("./websocket.service");
const driver_model_1 = __importDefault(require("../models/driver.model"));
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
            (0, websocket_service_1.sendMessageToUser)(nextDriver.userId, 'new_ride_offer', { rideId: ride.id, details: ride, timeout: config.rideAcceptTime });
            const timer = setTimeout(() => handleOfferExpiration(ride.id), config.rideAcceptTime * 1000);
            offerTimers.set(ride.id, timer);
        }
        else {
            console.log(`No available drivers for ride ${rideId}.`);
            yield ride.update({ status: ride_model_1.RideStatus.CANCELLED });
            (0, websocket_service_1.sendMessageToUser)(ride.customerId, 'ride_update', { rideId: ride.id, status: ride_model_1.RideStatus.CANCELLED, message: 'No available drivers found.' });
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
function handleDriverAccept(rideId, driverId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ride = yield ride_model_1.default.findByPk(rideId);
        // This was the source of a build error. Added a check for ride.offerExpiresAt.
        if (!ride || ride.status !== ride_model_1.RideStatus.ASSIGNING || ride.currentDriverId !== driverId || !ride.offerExpiresAt || new Date() > ride.offerExpiresAt) {
            (0, websocket_service_1.sendMessageToUser)(driverId, 'offer_expired', { rideId });
            return;
        }
        console.log(`Driver ${driverId} accepted ride ${rideId}`);
        const timer = offerTimers.get(rideId);
        if (timer) {
            clearTimeout(timer);
            offerTimers.delete(rideId);
        }
        yield ride.update({
            status: ride_model_1.RideStatus.ACCEPTED,
            driverId: driverId,
            currentDriverId: null,
            offerExpiresAt: null
        });
        (0, websocket_service_1.sendMessageToUser)(ride.customerId, 'ride_accepted', { rideId, driverId, details: ride });
        (0, websocket_service_1.sendMessageToUser)(driverId, 'ride_confirmed', { rideId, details: ride });
    });
}
function handleDriverReject(rideId, driverId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride || ride.status !== ride_model_1.RideStatus.ASSIGNING || ride.currentDriverId !== driverId) {
            return;
        }
        console.log(`Driver ${driverId} rejected ride ${rideId}`);
        const timer = offerTimers.get(rideId);
        if (timer) {
            clearTimeout(timer);
            offerTimers.delete(rideId);
        }
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
        yield ride.update({ status: ride_model_1.RideStatus.CANCELLED });
        (0, websocket_service_1.sendMessageToUser)(ride.customerId, 'ride_cancelled', { rideId, cancelledBy });
        if (ride.driverId) {
            const driver = yield driver_model_1.default.findByPk(ride.driverId);
            if (driver)
                (0, websocket_service_1.sendMessageToUser)(driver.userId, 'ride_cancelled', { rideId, cancelledBy });
        }
        if (ride.currentDriverId) {
            const driver = yield driver_model_1.default.findByPk(ride.currentDriverId);
            if (driver)
                (0, websocket_service_1.sendMessageToUser)(driver.userId, 'ride_cancelled', { rideId, cancelledBy });
        }
    });
}
function handleRideCompletion(rideId) {
    return __awaiter(this, void 0, void 0, function* () {
        const ride = yield ride_model_1.default.findByPk(rideId, { include: [{ model: driver_model_1.default, as: 'driver' }] });
        if (!ride || !ride.driver || ride.status !== ride_model_1.RideStatus.ACCEPTED) {
            console.error(`Cannot complete ride ${rideId}. Invalid state.`);
            return;
        }
        yield ride.update({ status: ride_model_1.RideStatus.COMPLETED });
        const config = yield (0, config_service_1.getApplicableConfig)();
        const commissionRate = config.commissionRate || 0;
        const driver = ride.driver;
        let commission = 0;
        if (commissionRate > 0) {
            commission = ride.fare * (commissionRate / 100);
            const newOutstandingCommission = (driver.outstandingPlatformFee || 0) + commission;
            yield driver.update({ outstandingPlatformFee: newOutstandingCommission });
            (0, websocket_service_1.sendMessageToUser)(driver.userId, 'commission_charged', { rideId, commission, totalOutstanding: newOutstandingCommission });
        }
        (0, websocket_service_1.sendMessageToUser)(ride.customerId, 'ride_completed', { rideId, fare: ride.fare });
        (0, websocket_service_1.sendMessageToUser)(driver.userId, 'ride_completed', { rideId, fare: ride.fare, commission: commission });
        console.log(`Ride ${rideId} has been successfully completed.`);
    });
}

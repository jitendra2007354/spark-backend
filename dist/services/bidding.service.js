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
exports.acceptBid = exports.getBidsForRide = exports.createBid = void 0;
const bid_model_1 = __importDefault(require("../models/bid.model"));
const ride_model_1 = __importStar(require("../models/ride.model"));
const driver_model_1 = __importDefault(require("../models/driver.model")); // Import the Driver model
const websocket_service_1 = require("./websocket.service");
const database_service_1 = __importDefault(require("./database.service")); // Import sequelize for transactions
/**
 * Creates a new bid for a ride and notifies the customer.
 */
const createBid = (rideId, driverId, amount, customerId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bid = yield bid_model_1.default.create({ rideId, driverId: driverId, amount });
        (0, websocket_service_1.sendMessageToUser)(customerId, 'bid-new', {
            rideId,
            bidId: bid.id,
            driverId,
            amount
        });
        return bid;
    }
    catch (error) {
        console.error(`ERROR: Failed to create bid for ride ${rideId}:`, error);
        throw new Error('Failed to create bid.');
    }
});
exports.createBid = createBid;
/**
 * Retrieves all bids for a specific ride, including driver details.
 */
const getBidsForRide = (rideId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield bid_model_1.default.findAll({
            where: { rideId },
            include: [{
                    model: driver_model_1.default,
                    as: 'driver',
                    // It's good practice to select only the attributes you need
                    attributes: ['id', 'vehicleModel', 'vehicleType', 'averageRating'],
                }],
            order: [['amount', 'ASC']],
        });
    }
    catch (error) {
        console.error(`ERROR: Failed to retrieve bids for ride ${rideId}:`, error);
        return [];
    }
});
exports.getBidsForRide = getBidsForRide;
/**
 * Accepts a bid, updates the ride, and notifies all relevant drivers.
 * CORRECTED: This function now uses the correct Ride model properties and statuses.
 */
const acceptBid = (bidId, customerId) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield database_service_1.default.transaction();
    try {
        const winningBid = yield bid_model_1.default.findByPk(bidId, { transaction });
        if (!winningBid) {
            throw new Error('Bid not found');
        }
        const ride = yield ride_model_1.default.findByPk(winningBid.rideId, { transaction });
        if (!ride) {
            throw new Error('Ride not found');
        }
        if (ride.customerId !== customerId) {
            throw new Error('You are not authorized to accept this bid.');
        }
        // The status must be PENDING to accept a bid.
        if (ride.status !== ride_model_1.RideStatus.PENDING) {
            throw new Error('This ride is no longer available for bidding.');
        }
        // 1. Update the winning bid's status
        winningBid.isAccepted = true;
        yield winningBid.save({ transaction });
        // 2. Update the ride with the winning driver and fare
        // Using the correct RideStatus enum and 'fare' property
        ride.status = ride_model_1.RideStatus.ACCEPTED;
        ride.driverId = winningBid.driverId;
        ride.fare = winningBid.amount; // The 'fare' field is used for the final amount
        yield ride.save({ transaction });
        // 3. Notify the winning driver
        (0, websocket_service_1.sendMessageToUser)(winningBid.driverId, 'bid-accepted', {
            rideId: ride.id,
            message: 'Your bid was accepted! The ride is now assigned to you.'
        });
        // 4. Notify all other drivers that their bid was rejected
        // Fetch all bids for the ride separately, as the association was removed.
        const allBids = yield bid_model_1.default.findAll({ where: { rideId: ride.id }, transaction });
        for (const bid of allBids) {
            if (bid.id !== winningBid.id) {
                (0, websocket_service_1.sendMessageToUser)(bid.driverId, 'bid-rejected', {
                    rideId: ride.id,
                    message: 'Your bid for this ride was not selected.'
                });
            }
        }
        yield transaction.commit();
        return { message: 'Bid accepted successfully and all drivers notified.' };
    }
    catch (error) {
        yield transaction.rollback();
        console.error(`ERROR: Failed to accept bid ${bidId}:`, error);
        throw error;
    }
});
exports.acceptBid = acceptBid;

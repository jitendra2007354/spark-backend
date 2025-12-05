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
exports.acceptBid = exports.getBidsForRide = exports.createBid = void 0;
const sequelize_1 = require("sequelize");
const bid_model_1 = __importDefault(require("../models/bid.model"));
const ride_model_1 = __importDefault(require("../models/ride.model"));
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
                    attributes: ['id', 'vehicleModel', 'vehicleType', 'rating'],
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
 * Accepts a bid, updates the ride, and notifies the driver.
 */
const acceptBid = (bidId, customerId) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield database_service_1.default.transaction();
    try {
        const bid = yield bid_model_1.default.findByPk(bidId, { transaction });
        if (!bid) {
            throw new Error('Bid not found');
        }
        const ride = yield ride_model_1.default.findByPk(bid.rideId, { transaction });
        if (!ride) {
            throw new Error('Ride not found');
        }
        if (ride.customerId !== customerId) {
            throw new Error('You are not authorized to accept this bid.');
        }
        if (ride.status !== 'pending') {
            throw new Error('This ride is no longer available for bidding.');
        }
        // Update the bid and ride
        bid.isAccepted = true;
        yield bid.save({ transaction });
        yield ride_model_1.default.update({
            status: 'accepted',
            driverId: bid.driverId,
            finalFare: bid.amount,
        }, { where: { id: bid.rideId }, transaction });
        // Notify the winning driver
        (0, websocket_service_1.sendMessageToUser)(bid.driverId, 'bid-accepted', {
            rideId: bid.rideId,
            message: 'Your bid has been accepted!'
        });
        // Reject all other bids for this ride
        const otherBids = yield bid_model_1.default.findAll({
            where: { rideId: bid.rideId, id: { [sequelize_1.Op.ne]: bidId } },
            transaction
        });
        for (const otherBid of otherBids) {
            (0, websocket_service_1.sendMessageToUser)(otherBid.driverId, 'bid-rejected', {
                rideId: bid.rideId,
                message: 'Your bid was not selected.'
            });
        }
        yield transaction.commit();
        return { message: 'Bid accepted successfully.' };
    }
    catch (error) {
        yield transaction.rollback();
        console.error(`ERROR: Failed to accept bid ${bidId}:`, error);
        throw error;
    }
});
exports.acceptBid = acceptBid;

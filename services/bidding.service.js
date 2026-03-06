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
exports.acceptCounterBid = exports.counterBid = exports.driverAcceptInstant = exports.acceptBid = exports.getBidsForRide = exports.createBid = void 0;
const sequelize_1 = require("sequelize");
const bid_model_1 = __importDefault(require("../models/bid.model"));
const ride_model_1 = __importStar(require("../models/ride.model"));
const driver_model_1 = __importDefault(require("../models/driver.model")); // Import the Driver model
const user_model_1 = __importDefault(require("../models/user.model")); // Import User for driver details
const vehicle_model_1 = __importDefault(require("../models/vehicle.model")); // Import Vehicle model
const socket_service_1 = require("./socket.service");
const database_service_1 = __importDefault(require("./database.service")); // Import sequelize for transactions
const payment_service_1 = require("./payment.service");
/**
 * Creates a new bid for a ride and notifies the customer.
 */
const createBid = (rideId, userId, amount, customerId) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield database_service_1.default.transaction();
    try {
        const driver = yield driver_model_1.default.findOne({
            where: { userId },
            include: [{ model: user_model_1.default, as: 'user', attributes: ['firstName', 'lastName', 'pfp'] }],
            transaction
        });
        if (!driver)
            throw new Error('Driver profile not found');
        // Check if the driver is currently on an active ride
        const activeRide = yield ride_model_1.default.findOne({
            where: {
                driverId: driver.id,
                status: { [sequelize_1.Op.in]: [ride_model_1.RideStatus.ACCEPTED, ride_model_1.RideStatus.ARRIVED, ride_model_1.RideStatus.IN_PROGRESS] }
            },
            transaction
        });
        if (activeRide)
            throw new Error('You cannot bid while on an active ride.');
        // Ensure the target ride is still PENDING (Concurrency check)
        const targetRide = yield ride_model_1.default.findByPk(rideId, { transaction });
        if (!targetRide || targetRide.status !== ride_model_1.RideStatus.PENDING) {
            throw new Error('Ride is no longer available for bidding.');
        }
        // Fetch the driver's currently active vehicle
        const activeVehicle = yield vehicle_model_1.default.findOne({ where: { userId: driver.userId, isDefault: true }, transaction });
        // Check if bid already exists for this driver and ride (Upsert)
        let bid = yield bid_model_1.default.findOne({ where: { rideId, driverId: driver.id }, transaction });
        if (bid) {
            bid.amount = amount;
            yield bid.save({ transaction });
        }
        else {
            bid = yield bid_model_1.default.create({ rideId, driverId: driver.id, amount }, { transaction });
        }
        yield transaction.commit();
        // Prepare driver details with active vehicle info
        const driverData = driver.toJSON();
        if (activeVehicle) {
            driverData.vehicleModel = activeVehicle.vehicleModel;
            driverData.vehicleType = activeVehicle.vehicleType;
            driverData.vehicleNumber = activeVehicle.vehicleNumber;
        }
        (0, socket_service_1.sendMessageToUser)(customerId, 'bid-new', {
            rideId,
            bidId: bid.id,
            driverId: driver.id,
            amount,
            driver: driverData // Send full driver details with active vehicle info
        });
        return bid;
    }
    catch (error) {
        yield transaction.rollback();
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
        const bids = yield bid_model_1.default.findAll({
            where: { rideId },
            include: [{
                    model: driver_model_1.default,
                    as: 'driver',
                    attributes: ['id', 'userId', 'averageRating'], // Added userId to fetch vehicle
                    include: [{
                            model: user_model_1.default,
                            as: 'user',
                            attributes: ['firstName', 'lastName', 'pfp']
                        }]
                }],
            order: [['amount', 'ASC']],
        });
        // Enrich bids with active vehicleDetails
        const bidsWithVehicle = yield Promise.all(bids.map((bid) => __awaiter(void 0, void 0, void 0, function* () {
            const bidJson = bid.toJSON();
            if (bid.driver) {
                const activeVehicle = yield vehicle_model_1.default.findOne({ where: { userId: bid.driver.userId, isDefault: true } });
                if (activeVehicle) {
                    bidJson.driver.vehicleModel = activeVehicle.vehicleModel;
                    bidJson.driver.vehicleType = activeVehicle.vehicleType;
                    bidJson.driver.vehicleNumber = activeVehicle.vehicleNumber;
                }
            }
            return bidJson;
        })));
        return bidsWithVehicle;
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
    let winningDriverUserId = null;
    let rejectedDriverUserIds = [];
    let feeCharged = { charged: false, amount: 0 };
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
        // 3. Process Daily Fee (Charge only if not charged in last 24h)
        feeCharged = yield (0, payment_service_1.processDailyFee)(winningBid.driverId, transaction);
        // 4. Notify the winning driver
        const winningDriver = yield driver_model_1.default.findByPk(winningBid.driverId, { transaction });
        if (winningDriver) {
            winningDriverUserId = winningDriver.userId;
        }
        // 5. Notify all other drivers that their bid was rejected
        // Fetch all bids for the ride separately, as the association was removed.
        const allBids = yield bid_model_1.default.findAll({
            where: { rideId: ride.id },
            include: [{ model: driver_model_1.default, as: 'driver' }],
            transaction
        });
        for (const bid of allBids) {
            if (bid.id !== winningBid.id && bid.driver) {
                rejectedDriverUserIds.push(bid.driver.userId);
            }
        }
        yield transaction.commit();
        // --- Notifications (Post-Commit) ---
        if (winningDriverUserId) {
            (0, socket_service_1.sendMessageToUser)(winningDriverUserId, 'bid-accepted', {
                rideId: ride.id,
                message: 'Your bid was accepted! The ride is now assigned to you.'
            });
            if (feeCharged.charged) {
                (0, socket_service_1.sendMessageToUser)(winningDriverUserId, 'daily_fee_charged', {
                    amount: feeCharged.amount,
                    message: `Daily access fee of ₹${feeCharged.amount} charged. Valid for 24 hours.`
                });
            }
        }
        rejectedDriverUserIds.forEach(userId => {
            (0, socket_service_1.sendMessageToUser)(userId, 'bid-rejected', { rideId: ride.id, message: 'Your bid for this ride was not selected.' });
        });
        return { message: 'Bid accepted successfully and all drivers notified.' };
    }
    catch (error) {
        yield transaction.rollback();
        console.error(`ERROR: Failed to accept bid ${bidId}:`, error);
        throw error;
    }
});
exports.acceptBid = acceptBid;
/**
 * Allows a driver to instantly accept the customer's requested fare (First-Come-First-Served).
 */
const driverAcceptInstant = (rideId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield database_service_1.default.transaction();
    let notificationData = null;
    let adminNotificationData = null;
    let feeCharged = { charged: false, amount: 0 };
    try {
        const driver = yield driver_model_1.default.findOne({
            where: { userId },
            include: [{ model: user_model_1.default, as: 'user' }]
        });
        if (!driver)
            throw new Error('Driver not found');
        // Check if the driver is currently on an active ride
        const activeRide = yield ride_model_1.default.findOne({
            where: {
                driverId: driver.id,
                status: { [sequelize_1.Op.in]: [ride_model_1.RideStatus.ACCEPTED, ride_model_1.RideStatus.ARRIVED, ride_model_1.RideStatus.IN_PROGRESS] }
            },
            transaction
        });
        if (activeRide)
            throw new Error('You cannot accept a ride while on an active trip.');
        const ride = yield ride_model_1.default.findByPk(rideId, { transaction });
        if (!ride)
            throw new Error('Ride not found');
        // Race condition check: Ensure ride is still pending
        if (ride.status !== ride_model_1.RideStatus.PENDING) {
            throw new Error('Ride is no longer available.');
        }
        // 1. Update Ride
        ride.status = ride_model_1.RideStatus.ACCEPTED;
        ride.driverId = driver.id;
        // fare is already set in ride.fare from creation
        yield ride.save({ transaction });
        // 2. Process Daily Fee
        feeCharged = yield (0, payment_service_1.processDailyFee)(driver.id, transaction);
        // Prepare notification data
        notificationData = {
            customerId: ride.customerId,
            driverUserId: userId,
            customerPayload: {
                rideId: ride.id,
                driverId: driver.id,
                fare: ride.fare,
                message: 'A driver has accepted your request!',
                driverDetails: driver
            },
            driverPayload: { rideId: ride.id, details: ride }
        };
        adminNotificationData = { rideId: ride.id, status: ride_model_1.RideStatus.ACCEPTED };
        // Note: We rely on the frontend of other drivers to remove the ride from the list 
        // when they try to bid/accept and get a "No longer available" error, or via a broadcast if implemented.
        yield transaction.commit();
        // --- Notifications (Post-Commit) ---
        (0, socket_service_1.sendMessageToUser)(notificationData.customerId, 'ride_confirmed', notificationData.customerPayload);
        (0, socket_service_1.sendMessageToUser)(notificationData.driverUserId, 'ride_confirmed', notificationData.driverPayload);
        (0, socket_service_1.sendMessageToAdminRoom)('ride_updated', adminNotificationData);
        if (feeCharged.charged) {
            (0, socket_service_1.sendMessageToUser)(userId, 'daily_fee_charged', {
                amount: feeCharged.amount,
                message: `Daily access fee of ₹${feeCharged.amount} charged. Valid for 24 hours.`
            });
        }
    }
    catch (error) {
        yield transaction.rollback();
        throw error;
    }
});
exports.driverAcceptInstant = driverAcceptInstant;
/**
 * Allows a customer to send a counter-offer to a specific driver's bid.
 */
const counterBid = (bidId, customerId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const bid = yield bid_model_1.default.findByPk(bidId, { include: [{ model: driver_model_1.default, as: 'driver' }] });
    if (!bid)
        throw new Error('Bid not found');
    const ride = yield ride_model_1.default.findByPk(bid.rideId);
    if (!ride)
        throw new Error('Ride not found');
    if (ride.customerId !== customerId) {
        throw new Error('Unauthorized: You cannot counter-bid on this ride.');
    }
    if (ride.status !== ride_model_1.RideStatus.PENDING) {
        throw new Error('Ride is no longer available for negotiation.');
    }
    // Notify the driver of the counter offer
    const driver = bid.driver;
    if (driver) {
        (0, socket_service_1.sendMessageToUser)(driver.userId, 'bid-counter-received', {
            rideId: ride.id,
            bidId: bid.id,
            amount: amount,
            message: `Customer has offered ₹${amount}.`
        });
    }
});
exports.counterBid = counterBid;
/**
 * Allows a driver to accept a customer's counter-offer.
 * This confirms the ride immediately at the counter-offer price.
 */
const acceptCounterBid = (bidId, driverId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield database_service_1.default.transaction();
    let notificationData = null;
    let feeCharged = { charged: false, amount: 0 };
    try {
        const bid = yield bid_model_1.default.findByPk(bidId);
        if (!bid)
            throw new Error('Bid not found');
        // Verify the driver owns this bid
        if (bid.driverId !== driverId)
            throw new Error('Unauthorized: This is not your bid.');
        const ride = yield ride_model_1.default.findByPk(bid.rideId, { transaction });
        if (!ride)
            throw new Error('Ride not found');
        if (ride.status !== ride_model_1.RideStatus.PENDING) {
            throw new Error('Ride is no longer available.');
        }
        // 1. Update Ride (Confirm it)
        ride.status = ride_model_1.RideStatus.ACCEPTED;
        ride.driverId = driverId;
        ride.fare = amount; // Set fare to the agreed counter amount
        yield ride.save({ transaction });
        // 2. Process Daily Fee
        feeCharged = yield (0, payment_service_1.processDailyFee)(driverId, transaction);
        // 3. Update Bid status
        bid.amount = amount; // Update bid to reflect final agreed price
        bid.isAccepted = true;
        yield bid.save({ transaction });
        const driver = yield driver_model_1.default.findByPk(driverId);
        if (driver) {
            notificationData = {
                customerId: ride.customerId,
                driverUserId: driver.userId,
                customerPayload: {
                    rideId: ride.id,
                    driverId: driverId,
                    fare: amount,
                    message: 'Driver accepted your offer!'
                },
                driverPayload: { rideId: ride.id, details: ride }
            };
        }
        yield transaction.commit();
        // --- Notifications (Post-Commit) ---
        if (notificationData) {
            (0, socket_service_1.sendMessageToUser)(notificationData.customerId, 'ride_confirmed', notificationData.customerPayload);
            (0, socket_service_1.sendMessageToUser)(notificationData.driverUserId, 'ride_confirmed', notificationData.driverPayload);
        }
        if (feeCharged.charged && driver) {
            (0, socket_service_1.sendMessageToUser)(driver.userId, 'daily_fee_charged', {
                amount: feeCharged.amount,
                message: `Daily access fee of ₹${feeCharged.amount} charged. Valid for 24 hours.`
            });
        }
        return { message: 'Counter-offer accepted. Ride confirmed.' };
    }
    catch (error) {
        yield transaction.rollback();
        throw error;
    }
});
exports.acceptCounterBid = acceptCounterBid;

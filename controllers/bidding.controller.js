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
exports.driverAcceptInstantController = exports.acceptCounterBidController = exports.counterBidController = exports.acceptBidController = exports.getBidsController = exports.createBidController = void 0;
const bidding_service_1 = require("../services/bidding.service");
const ride_model_1 = __importStar(require("../models/ride.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
/**
 * Controller to handle the creation of a new bid by a driver.
 */
const createBidController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { rideId, amount } = req.body;
    const driverId = req.user.id;
    const userType = req.user.userType;
    // If rideId is not in body, check params (RESTful convention)
    if (!rideId && req.params.rideId) {
        rideId = parseInt(req.params.rideId, 10);
    }
    rideId = Number(rideId);
    // 1. Authorization: Ensure the user is a driver
    if (userType !== 'Driver') {
        return res.status(403).json({ message: 'Forbidden: Only drivers can place bids' });
    }
    // 2. Input Validation
    if (!rideId || amount === undefined || amount <= 0) {
        return res.status(400).json({ message: 'Missing or invalid required fields: rideId and amount.' });
    }
    try {
        // 3. Find the ride to get the customerId for notification
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found.' });
        }
        // Ensure the ride is actually available for bidding
        if (ride.status !== ride_model_1.RideStatus.PENDING) {
            return res.status(400).json({ message: 'This ride is no longer available for bidding.' });
        }
        // 4. Create the bid and notify the customer
        const customerId = ride.customerId;
        const bid = yield (0, bidding_service_1.createBid)(rideId, driverId, amount, customerId);
        res.status(201).json(bid);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Error in createBidController: ${errorMessage}`);
        res.status(500).json({ message: 'Failed to create bid.', error: errorMessage });
    }
});
exports.createBidController = createBidController;
/**
 * Controller to retrieve all bids for a specific ride.
 */
const getBidsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rideId } = req.params;
    try {
        const bids = yield (0, bidding_service_1.getBidsForRide)(Number(rideId));
        res.status(200).json(bids);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to retrieve bids.', error });
    }
});
exports.getBidsController = getBidsController;
/**
 * Controller for a customer to accept a bid.
 */
const acceptBidController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bidId } = req.body;
    const customerId = req.user.id;
    const userType = req.user.userType;
    // 1. Authorization: Ensure the user is a customer
    if (userType !== 'Customer') {
        return res.status(403).json({ message: 'Forbidden: Only customers can accept bids' });
    }
    // 2. Input validation
    if (!bidId) {
        return res.status(400).json({ message: 'Missing required field: bidId' });
    }
    try {
        const result = yield (0, bidding_service_1.acceptBid)(Number(bidId), customerId);
        res.status(200).json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Error in acceptBidController: ${errorMessage}`);
        res.status(500).json({ message: 'Failed to accept bid.', error: errorMessage });
    }
});
exports.acceptBidController = acceptBidController;
/**
 * Controller for a customer to send a counter-bid to a driver.
 */
const counterBidController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bidId, amount } = req.body;
    const customerId = req.user.id;
    if (req.user.userType !== 'Customer')
        return res.status(403).json({ message: 'Forbidden' });
    if (!bidId || !amount)
        return res.status(400).json({ message: 'Missing bidId or amount' });
    try {
        yield (0, bidding_service_1.counterBid)(Number(bidId), customerId, Number(amount));
        res.status(200).json({ message: 'Counter-offer sent to driver.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to send counter-bid.', error: error.message });
    }
});
exports.counterBidController = counterBidController;
/**
 * Controller for a driver to accept a counter-bid.
 */
const acceptCounterBidController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { bidId, amount } = req.body;
    const driverUserId = req.user.id; // This is User ID, need to resolve to Driver ID
    if (req.user.userType !== 'Driver')
        return res.status(403).json({ message: 'Forbidden' });
    try {
        // Resolve Driver ID
        const driver = yield driver_model_1.default.findOne({ where: { userId: driverUserId } });
        if (!driver)
            return res.status(404).json({ message: 'Driver profile not found' });
        const result = yield (0, bidding_service_1.acceptCounterBid)(Number(bidId), driver.id, Number(amount));
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to accept counter-bid.', error: error.message });
    }
});
exports.acceptCounterBidController = acceptCounterBidController;
/**
 * Controller for a driver to instantly accept a ride request at the customer's price.
 */
const driverAcceptInstantController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { rideId } = req.body;
    const driverUserId = req.user.id;
    if (!rideId && req.params.rideId) {
        rideId = parseInt(req.params.rideId, 10);
    }
    if (!rideId)
        return res.status(400).json({ message: 'Missing required field: rideId' });
    if (req.user.userType !== 'Driver')
        return res.status(403).json({ message: 'Forbidden' });
    try {
        yield (0, bidding_service_1.driverAcceptInstant)(Number(rideId), driverUserId);
        res.status(200).json({ message: 'Ride accepted successfully.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to accept ride.', error: error.message });
    }
});
exports.driverAcceptInstantController = driverAcceptInstantController;

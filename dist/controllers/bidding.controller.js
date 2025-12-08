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
exports.acceptBidController = exports.getBidsController = exports.createBidController = void 0;
const bidding_service_1 = require("../services/bidding.service");
const ride_model_1 = __importDefault(require("../models/ride.model"));
/**
 * Controller to handle the creation of a new bid by a driver.
 */
const createBidController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rideId, amount } = req.body;
    const driverId = req.user.id;
    const userType = req.user.userType;
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
        if (ride.status !== 'pending') {
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
        const result = yield (0, bidding_service_1.acceptBid)(bidId, customerId);
        res.status(200).json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error(`Error in acceptBidController: ${errorMessage}`);
        res.status(500).json({ message: 'Failed to accept bid.', error: errorMessage });
    }
});
exports.acceptBidController = acceptBidController;

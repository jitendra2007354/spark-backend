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
exports.updateRideStatus = exports.confirmRide = exports.getAvailableRides = exports.createRide = void 0;
const ride_model_1 = __importDefault(require("../models/ride.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const ride_service_1 = require("../services/ride.service");
// @desc    Create a new ride request
// @route   POST /api/rides
// @access  Private (Customer)
const createRide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pickupLocation, dropoffLocation, pickupAddress, dropoffAddress, vehicleType } = req.body;
    const customerId = req.user.id;
    // 1. Input Validation
    if (!pickupLocation || !dropoffLocation || !pickupAddress || !dropoffAddress || !vehicleType) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
        // In a real app, you might get an estimated fare here using a service like Google Maps
        // For now, we will just create the ride request
        const newRide = yield ride_model_1.default.create({
            customerId,
            pickupLocation,
            dropoffLocation,
            pickupAddress,
            dropoffAddress,
            vehicleType,
            status: 'pending',
        });
        // TODO: Notify nearby drivers via WebSocket or a push notification service
        res.status(201).json(newRide);
    }
    catch (error) {
        console.error('Error creating ride:', error);
        res.status(500).json({ message: 'Server error while creating ride' });
    }
});
exports.createRide = createRide;
// @desc    Get all available (pending) rides
// @route   GET /api/rides/available
// @access  Private (Driver)
const getAvailableRides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const availableRides = yield ride_model_1.default.findAll({
            where: { status: 'pending' },
            include: [{
                    model: user_model_1.default,
                    as: 'customer',
                    attributes: ['id', 'firstName', 'lastName', 'profilePicture'], // Include customer details
                }],
            order: [['createdAt', 'DESC']], // Show newest requests first
        });
        res.status(200).json(availableRides);
    }
    catch (error) {
        console.error('Error fetching available rides:', error);
        res.status(500).json({ message: 'Server error while fetching rides' });
    }
});
exports.getAvailableRides = getAvailableRides;
// @desc    Confirm a ride after a bid has been accepted
// @route   POST /api/rides/:rideId/confirm
// @access  Private (Customer)
const confirmRide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rideId } = req.params;
    const customerId = req.user.id;
    try {
        const confirmedRide = yield (0, ride_service_1.confirmRide)(parseInt(rideId, 10), customerId);
        res.status(200).json(confirmedRide);
    }
    catch (error) {
        console.error('Error confirming ride:', error);
        // Provide a more specific error message if available
        res.status(400).json({ message: error.message || 'Failed to confirm ride' });
    }
});
exports.confirmRide = confirmRide;
// @desc    Update the status of a ride (e.g., arrived, enroute, completed)
// @route   PATCH /api/rides/:rideId/status
// @access  Private (Driver)
const updateRideStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rideId } = req.params;
    const { status } = req.body;
    const driverId = req.user.id;
    if (!status) {
        return res.status(400).json({ message: 'Missing status field' });
    }
    try {
        const updatedRide = yield (0, ride_service_1.updateRideStatus)(parseInt(rideId, 10), driverId, status);
        res.status(200).json(updatedRide);
    }
    catch (error) {
        console.error('Error updating ride status:', error);
        res.status(400).json({ message: error.message || 'Failed to update ride status' });
    }
});
exports.updateRideStatus = updateRideStatus;

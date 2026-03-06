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
exports.updateRideStatus = exports.confirmRide = exports.cancelRide = exports.rejectRide = exports.acceptRide = exports.getRideById = exports.getAvailableRides = exports.createRide = void 0;
const ride_model_1 = __importStar(require("../models/ride.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
const ride_service_1 = require("../services/ride.service");
const googleMaps_service_1 = require("../services/googleMaps.service");
const rideChainService = __importStar(require("../services/ride.chain.service"));
const biddingService = __importStar(require("../services/bidding.service"));
// @desc    Create a new ride request
// @route   POST /api/rides
// @access  Private (Customer)
const createRide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pickupLocation, dropoffLocation, pickupAddress, dropoffAddress, vehicleType, fare } = req.body;
    const customerId = req.user.id;
    // 1. Input Validation
    if (!pickupLocation || !dropoffLocation || !vehicleType || !fare) {
        return res.status(400).json({ message: 'Missing required fields: pickup/dropoff location, vehicleType, fare' });
    }
    try {
        // 1. Calculate Distance and Duration (for driver info)
        const { distance, duration } = yield (0, googleMaps_service_1.getDistanceAndDuration)(pickupLocation, dropoffLocation);
        const newRide = yield (0, ride_service_1.createRide)({
            customerId,
            pickupLocation,
            dropoffLocation,
            pickupAddress: pickupAddress || 'Unknown Location',
            dropoffAddress: dropoffAddress || 'Unknown Location',
            vehicleType,
            fare: parseFloat(fare), // User's bid is the bill amount
            distance,
            duration,
            status: ride_model_1.RideStatus.PENDING,
        });
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
            where: { status: ride_model_1.RideStatus.PENDING },
            include: [{
                    model: user_model_1.default,
                    as: 'customer',
                    attributes: ['id', 'firstName', 'lastName', 'pfp'], // Include customer details
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
// @desc    Get ride details by ID
// @route   GET /api/rides/:id
// @access  Private
const getRideById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const ride = yield ride_model_1.default.findByPk(id, {
            include: [
                {
                    model: user_model_1.default,
                    as: 'customer',
                    attributes: ['id', 'firstName', 'lastName', 'phoneNumber', 'pfp']
                },
                {
                    model: driver_model_1.default,
                    as: 'driver',
                    include: [{ model: user_model_1.default, as: 'user', attributes: ['firstName', 'lastName', 'phoneNumber', 'pfp'] }]
                }
            ]
        });
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found' });
        }
        res.status(200).json(ride);
    }
    catch (error) {
        console.error('Error fetching ride:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
});
exports.getRideById = getRideById;
// @desc    Accept a ride request (Driver)
// @route   POST /api/rides/:id/accept
// @access  Private (Driver)
const acceptRide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const ride = yield ride_model_1.default.findByPk(id);
        if (!ride)
            return res.status(404).json({ message: 'Ride not found' });
        // Dispatch based on Ride Status
        if (ride.status === ride_model_1.RideStatus.ASSIGNING) {
            // Chain/Round-Robin Mode
            yield rideChainService.handleDriverAccept(Number(id), userId);
        }
        else if (ride.status === ride_model_1.RideStatus.PENDING) {
            // Bidding/Instant Accept Mode
            yield biddingService.driverAcceptInstant(Number(id), userId);
        }
        else {
            return res.status(400).json({ message: 'Ride is not available for acceptance.' });
        }
        // Return the updated ride details
        const updatedRide = yield ride_model_1.default.findByPk(id);
        res.json(updatedRide);
    }
    catch (error) {
        console.error('Accept Ride Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});
exports.acceptRide = acceptRide;
// @desc    Reject a ride request (Driver)
// @route   POST /api/rides/:id/reject
// @access  Private (Driver)
const rejectRide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        yield rideChainService.handleDriverReject(Number(id), userId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Reject Ride Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});
exports.rejectRide = rejectRide;
// @desc    Cancel a ride
// @route   POST /api/rides/:id/cancel
// @access  Private (Customer or Driver)
const cancelRide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.user;
        const userType = user.userType;
        yield rideChainService.handleRideCancellation(Number(id), userType);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Cancel Ride Error:', error);
        res.status(500).json({ message: error.message || 'Internal server error' });
    }
});
exports.cancelRide = cancelRide;
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

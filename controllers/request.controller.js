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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelRideRequest = exports.getRideDetails = exports.requestRide = void 0;
const ride_service_1 = require("../services/ride.service");
const googleMaps_service_1 = require("../services/googleMaps.service");
const ride_chain_service_1 = require("../services/ride.chain.service");
const requestRide = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { pickupLocation, dropoffLocation, vehicleType, fare } = req.body;
        // Calculate distance and duration
        const { distance, duration } = yield (0, googleMaps_service_1.getDistanceAndDuration)(pickupLocation, dropoffLocation);
        const ride = yield (0, ride_service_1.createRide)({
            customerId: userId,
            pickupLocation,
            dropoffLocation,
            vehicleType,
            fare,
            distance,
            duration
        });
        res.status(201).json(ride);
    }
    catch (error) {
        console.error('Request error:', error);
        res.status(500).json({ message: error.message || 'Failed to request' });
    }
});
exports.requestRide = requestRide;
const getRideDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const ride = yield (0, ride_service_1.getRideById)(Number(id));
        if (!ride) {
            return res.status(404).json({ message: 'Request not found' });
        }
        res.json(ride);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getRideDetails = getRideDetails;
const cancelRideRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Assuming this endpoint is hit by the customer
        yield (0, ride_chain_service_1.handleRideCancellation)(Number(id), 'Customer');
        res.json({ message: 'Request cancelled successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.cancelRideRequest = cancelRideRequest;

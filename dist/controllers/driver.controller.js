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
exports.getNearbyDrivers = exports.getDriverRides = void 0;
const ride_service_1 = require("../services/ride.service");
const driver_service_1 = require("../services/driver.service");
const getDriverRides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const driverId = req.user.id;
    try {
        const rides = yield (0, ride_service_1.getDriverRideHistory)(driverId);
        res.status(200).json(rides);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get ride history', message: error.message });
    }
});
exports.getDriverRides = getDriverRides;
const getNearbyDrivers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { lat, lng, vehicleType } = req.query;
    if (!lat || !lng || !vehicleType) {
        return res.status(400).json({ error: 'Missing required query parameters: lat, lng, vehicleType' });
    }
    try {
        const drivers = yield (0, driver_service_1.findNearbyDrivers)(parseFloat(lat), parseFloat(lng), vehicleType);
        res.status(200).json(drivers);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to find nearby drivers', message: error.message });
    }
});
exports.getNearbyDrivers = getNearbyDrivers;

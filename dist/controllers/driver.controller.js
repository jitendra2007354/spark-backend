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
Object.defineProperty(exports, "__esModule", { value: true });
exports.unblockDriver = exports.blockDriver = exports.getNearbyDrivers = exports.getDriverRides = void 0;
const ride_service_1 = require("../services/ride.service");
const DriverService = __importStar(require("../services/driver.service")); // Import all driver services
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
        const drivers = yield DriverService.findNearbyDrivers(parseFloat(lat), parseFloat(lng), vehicleType);
        res.status(200).json(drivers);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to find nearby drivers', message: error.message });
    }
});
exports.getNearbyDrivers = getNearbyDrivers;
// --- NEW: Admin actions for blocking/unblocking drivers ---
const blockDriver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // This is the userId from the route parameter
    try {
        yield DriverService.blockDriver(parseInt(id, 10));
        res.status(200).json({ message: `User ${id} has been successfully blocked.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to block driver', message: error.message });
    }
});
exports.blockDriver = blockDriver;
const unblockDriver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params; // This is the userId from the route parameter
    try {
        yield DriverService.unblockDriver(parseInt(id, 10));
        res.status(200).json({ message: `User ${id} has been successfully unblocked.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to unblock driver', message: error.message });
    }
});
exports.unblockDriver = unblockDriver;

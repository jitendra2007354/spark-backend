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
exports.getDriverLocation = exports.getAllOnlineDriverLocations = exports.findAllNearbyDrivers = exports.findNearbyAvailableDrivers = exports.findNearestAvailableDriver = exports.removeDriverLocation = exports.updateDriverLocation = void 0;
const driver_location_model_1 = __importDefault(require("../models/driver-location.model"));
const database_service_1 = __importDefault(require("./database.service"));
const sequelize_1 = require("sequelize");
const driver_model_1 = __importDefault(require("../models/driver.model"));
const ride_model_1 = __importStar(require("../models/ride.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const config_service_1 = require("./config.service");
const socket_service_1 = require("./socket.service");
/**
 * Creates or updates a driver's location and broadcasts it to admins and relevant customers.
 */
const updateDriverLocation = (driverId_1, lat_1, lng_1, ...args_1) => __awaiter(void 0, [driverId_1, lat_1, lng_1, ...args_1], void 0, function* (driverId, lat, lng, shouldPersist = true) {
    if (shouldPersist) {
        yield driver_location_model_1.default.upsert({
            driverId: driverId,
            location: { type: 'Point', coordinates: [lng, lat] },
        });
    }
    const newLocation = { driverId: driverId, location: { lat, lng } };
    // 1. Stream the new location to the admin room
    (0, socket_service_1.sendMessageToAdminRoom)('driver_location_updated', newLocation);
    // 2. Find the driver's active ride
    const activeRide = yield ride_model_1.default.findOne({
        where: {
            driverId: driverId,
            status: { [sequelize_1.Op.in]: [ride_model_1.RideStatus.ACCEPTED, ride_model_1.RideStatus.ARRIVED, ride_model_1.RideStatus.IN_PROGRESS] }
        }
    });
    // 3. If there is an active ride, send the location to the customer
    if (activeRide) {
        (0, socket_service_1.sendMessageToUser)(activeRide.customerId, 'driver_location_updated', newLocation);
    }
});
exports.updateDriverLocation = updateDriverLocation;
/**
 * Removes a driver's location from the database.
 */
const removeDriverLocation = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield driver_model_1.default.findOne({ where: { userId } });
    if (!driver)
        return;
    yield driver_location_model_1.default.destroy({ where: { driverId: driver.id } });
});
exports.removeDriverLocation = removeDriverLocation;
/**
 * Finds the single nearest available driver using a geospatial query.
 */
const findNearestAvailableDriver = (lat_1, lng_1, vehicleType_1, ...args_1) => __awaiter(void 0, [lat_1, lng_1, vehicleType_1, ...args_1], void 0, function* (lat, lng, vehicleType, excludedDriverIds = []) {
    // Sanitize inputs to ensure they are numbers
    const safeLat = parseFloat(String(lat));
    const safeLng = parseFloat(String(lng));
    if (isNaN(safeLat) || isNaN(safeLng))
        throw new Error("Invalid coordinates");
    const userLocationStr = `ST_GeomFromText('POINT(${safeLng} ${safeLat})')`;
    const location = yield driver_location_model_1.default.findOne({
        include: [{
                model: driver_model_1.default,
                as: 'driver',
                required: true,
                where: {
                    vehicleType: vehicleType,
                    id: { [sequelize_1.Op.notIn]: excludedDriverIds }
                },
                include: [
                    {
                        model: user_model_1.default,
                        as: 'user',
                        where: {
                            isOnline: true,
                            isBlocked: false,
                            licenseIsVerified: true,
                            rcIsVerified: true
                        }
                    },
                    {
                        model: ride_model_1.default,
                        as: 'ridesAsDriver',
                        required: false, // LEFT JOIN
                        attributes: ['id'],
                        where: {
                            status: { [sequelize_1.Op.in]: [ride_model_1.RideStatus.ACCEPTED, ride_model_1.RideStatus.ARRIVED, ride_model_1.RideStatus.IN_PROGRESS] }
                        }
                    }
                ]
            }],
        where: { '$driver.ridesAsDriver.id$': null }, // Filter out drivers who have an active ride
        order: database_service_1.default.literal(`ST_Distance_Sphere(location, ${userLocationStr})`),
    });
    return location ? location.driver : null;
});
exports.findNearestAvailableDriver = findNearestAvailableDriver;
/**
 * Finds ALL nearby available drivers for bidding.
 */
const findNearbyAvailableDrivers = (lat, lng, vehicleType, city) => __awaiter(void 0, void 0, void 0, function* () {
    const config = yield (0, config_service_1.getApplicableConfig)(city);
    // Sanitize inputs
    const safeLat = parseFloat(String(lat));
    const safeLng = parseFloat(String(lng));
    if (isNaN(safeLat) || isNaN(safeLng))
        throw new Error("Invalid coordinates");
    const searchRadius = (config.driverSearchRadius || 5) * 1000; // Radius in meters
    const userLocation = database_service_1.default.literal(`ST_GeomFromText('POINT(${safeLng} ${safeLat})')`);
    const locations = yield driver_location_model_1.default.findAll({
        where: database_service_1.default.and(database_service_1.default.where(database_service_1.default.fn('ST_Distance_Sphere', database_service_1.default.col('location'), userLocation), { [sequelize_1.Op.lte]: searchRadius }), { '$driver.ridesAsDriver.id$': null } // Filter out busy drivers
        ),
        include: [{
                model: driver_model_1.default,
                as: 'driver',
                required: true,
                where: {
                    vehicleType: vehicleType
                },
                include: [
                    {
                        model: user_model_1.default,
                        as: 'user',
                        where: {
                            isOnline: true,
                            isBlocked: false,
                            licenseIsVerified: true,
                            rcIsVerified: true
                        }
                    },
                    {
                        model: ride_model_1.default,
                        as: 'ridesAsDriver',
                        required: false,
                        attributes: ['id'],
                        where: {
                            status: { [sequelize_1.Op.in]: [ride_model_1.RideStatus.ACCEPTED, ride_model_1.RideStatus.ARRIVED, ride_model_1.RideStatus.IN_PROGRESS] }
                        }
                    }
                ]
            }]
    });
    return locations.map(location => location.driver);
});
exports.findNearbyAvailableDrivers = findNearbyAvailableDrivers;
/**
 * Finds all nearby drivers regardless of vehicle type (for customer map view).
 */
const findAllNearbyDrivers = (lat_1, lng_1, ...args_1) => __awaiter(void 0, [lat_1, lng_1, ...args_1], void 0, function* (lat, lng, radiusInKm = 5, vehicleType) {
    const safeLat = parseFloat(String(lat));
    const safeLng = parseFloat(String(lng));
    if (isNaN(safeLat) || isNaN(safeLng))
        throw new Error("Invalid coordinates");
    const searchRadius = radiusInKm * 1000;
    const userLocation = database_service_1.default.literal(`ST_GeomFromText('POINT(${safeLng} ${safeLat})')`);
    const driverWhereClause = {};
    if (vehicleType) {
        driverWhereClause.vehicleType = vehicleType;
    }
    const locations = yield driver_location_model_1.default.findAll({
        attributes: [
            'driverId',
            [database_service_1.default.fn('ST_X', database_service_1.default.col('location')), 'lng'],
            [database_service_1.default.fn('ST_Y', database_service_1.default.col('location')), 'lat']
        ],
        where: database_service_1.default.and(database_service_1.default.where(database_service_1.default.fn('ST_Distance_Sphere', database_service_1.default.col('location'), userLocation), { [sequelize_1.Op.lte]: searchRadius }), { '$driver.ridesAsDriver.id$': null }),
        include: [{
                model: driver_model_1.default,
                as: 'driver',
                required: true,
                where: driverWhereClause,
                include: [
                    {
                        model: user_model_1.default,
                        as: 'user',
                        where: {
                            isOnline: true,
                            isBlocked: false,
                            licenseIsVerified: true,
                            rcIsVerified: true
                        }
                    },
                    {
                        model: ride_model_1.default,
                        as: 'ridesAsDriver',
                        required: false,
                        attributes: ['id'],
                        where: {
                            status: { [sequelize_1.Op.in]: [ride_model_1.RideStatus.ACCEPTED, ride_model_1.RideStatus.ARRIVED, ride_model_1.RideStatus.IN_PROGRESS] }
                        }
                    }
                ]
            }]
    });
    // Map to include location data along with driver info
    return locations.map(l => {
        const loc = l.get({ plain: true });
        return Object.assign(Object.assign({}, loc.driver), { lat: loc.lat, lng: loc.lng });
    });
});
exports.findAllNearbyDrivers = findAllNearbyDrivers;
/**
 * Retrieves the current location of all online drivers.
 * Used to populate the admin's live map on initial load.
 */
const getAllOnlineDriverLocations = () => __awaiter(void 0, void 0, void 0, function* () {
    const locations = yield driver_location_model_1.default.findAll({
        include: [{
                model: driver_model_1.default,
                as: 'driver',
                required: true,
                attributes: ['id', 'vehicleType'],
                include: [{
                        model: user_model_1.default,
                        as: 'user',
                        attributes: ['firstName', 'lastName']
                    }]
            }],
        attributes: [
            'driverId',
            [database_service_1.default.fn('ST_X', database_service_1.default.col('location')), 'lng'],
            [database_service_1.default.fn('ST_Y', database_service_1.default.col('location')), 'lat']
        ]
    });
    return locations.map(l => {
        const loc = l.get({ plain: true });
        const driver = loc.driver;
        const user = driver ? driver.user : null;
        return {
            driverId: loc.driverId,
            lat: loc.lat,
            lng: loc.lng,
            name: user ? `${user.firstName} ${user.lastName}` : 'Unknown Driver',
            vehicleType: driver ? driver.vehicleType : 'Unknown'
        };
    });
});
exports.getAllOnlineDriverLocations = getAllOnlineDriverLocations;
/**
 * Retrieves the current location of a specific driver.
 */
const getDriverLocation = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    const location = yield driver_location_model_1.default.findOne({ where: { driverId } });
    if (location && location.location) {
        const coords = location.location.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
            return { lat: coords[1], lng: coords[0] };
        }
    }
    return null;
});
exports.getDriverLocation = getDriverLocation;

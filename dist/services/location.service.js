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
exports.getAllOnlineDriverLocations = exports.findNearbyAvailableDrivers = exports.findNearestAvailableDriver = exports.removeDriverLocation = exports.updateDriverLocation = void 0;
const driver_location_model_1 = __importDefault(require("../models/driver-location.model"));
const database_service_1 = __importDefault(require("../services/database.service")); // Corrected import
const sequelize_1 = require("sequelize");
const driver_model_1 = __importDefault(require("../models/driver.model"));
const ride_model_1 = __importDefault(require("../models/ride.model"));
const config_service_1 = require("./config.service");
const websocket_service_1 = require("./websocket.service");
/**
 * Creates or updates a driver's location and broadcasts it to admins and relevant customers.
 */
const updateDriverLocation = (driverId, lat, lng) => __awaiter(void 0, void 0, void 0, function* () {
    yield driver_location_model_1.default.upsert({
        driverId,
        location: { type: 'Point', coordinates: [lng, lat] },
    });
    const newLocation = { driverId, location: { lat, lng } };
    // 1. Stream the new location to the admin room
    (0, websocket_service_1.sendMessageToAdminRoom)('driver_location_updated', newLocation);
    // 2. Find the driver's active ride
    const activeRide = yield ride_model_1.default.findOne({
        where: {
            driverId,
            status: { [sequelize_1.Op.in]: ['accepted', 'confirmed', 'enroute', 'arrived'] }
        }
    });
    // 3. If there is an active ride, send the location to the customer
    if (activeRide) {
        (0, websocket_service_1.sendMessageToUser)(activeRide.customerId, 'driver_location_updated', newLocation);
    }
});
exports.updateDriverLocation = updateDriverLocation;
/**
 * Removes a driver's location from the database.
 */
const removeDriverLocation = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    yield driver_location_model_1.default.destroy({ where: { driverId } });
});
exports.removeDriverLocation = removeDriverLocation;
/**
 * Finds the single nearest available driver using a geospatial query.
 */
const findNearestAvailableDriver = (lat_1, lng_1, vehicleType_1, ...args_1) => __awaiter(void 0, [lat_1, lng_1, vehicleType_1, ...args_1], void 0, function* (lat, lng, vehicleType, excludedDriverIds = []) {
    const userLocation = database_service_1.default.literal(`ST_GeomFromText('POINT(${lng} ${lat})')`);
    const location = yield driver_location_model_1.default.findOne({
        include: [{
                model: driver_model_1.default,
                as: 'driver',
                required: true,
                where: {
                    isAvailable: true,
                    vehicleType: vehicleType,
                    id: { [sequelize_1.Op.notIn]: excludedDriverIds }
                }
            }],
        order: database_service_1.default.literal(`ST_Distance_Sphere(location, ${userLocation})`),
    });
    return location ? location.driver : null;
});
exports.findNearestAvailableDriver = findNearestAvailableDriver;
/**
 * Finds ALL nearby available drivers for bidding.
 */
const findNearbyAvailableDrivers = (lat, lng, vehicleType, city) => __awaiter(void 0, void 0, void 0, function* () {
    const config = yield (0, config_service_1.getApplicableConfig)(city);
    const searchRadius = (config.driverSearchRadius || 5) * 1000; // Radius in meters
    const userLocation = database_service_1.default.literal(`ST_GeomFromText('POINT(${lng} ${lat})')`);
    const locations = yield driver_location_model_1.default.findAll({
        where: database_service_1.default.where(database_service_1.default.fn('ST_Distance_Sphere', database_service_1.default.col('location'), userLocation), { [sequelize_1.Op.lte]: searchRadius }),
        include: [{
                model: driver_model_1.default,
                as: 'driver',
                required: true,
                where: { isAvailable: true, vehicleType: vehicleType }
            }]
    });
    return locations.map(location => location.driver);
});
exports.findNearbyAvailableDrivers = findNearbyAvailableDrivers;
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
                attributes: ['id', 'name', 'vehicleType']
            }],
        attributes: [
            'driverId',
            [database_service_1.default.fn('ST_X', database_service_1.default.col('location')), 'lng'],
            [database_service_1.default.fn('ST_Y', database_service_1.default.col('location')), 'lat']
        ],
        raw: true
    });
    return locations;
});
exports.getAllOnlineDriverLocations = getAllOnlineDriverLocations;

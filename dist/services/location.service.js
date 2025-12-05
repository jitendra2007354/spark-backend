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
exports.removeDriverLocation = exports.getAllDriverLocations = exports.updateDriverLocation = void 0;
const driver_location_model_1 = __importDefault(require("../models/driver-location.model"));
/**
 * Updates or creates a driver's location in the database.
 * This operation is an 'upsert': it updates the record if the driverId exists, otherwise it creates a new one.
 * @param driverId The ID of the driver.
 * @param lat The latitude of the driver's location.
 * @param lng The longitude of the driver's location.
 */
const updateDriverLocation = (driverId, lat, lng) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield driver_location_model_1.default.upsert({
            driverId,
            latitude: lat,
            longitude: lng,
        });
    }
    catch (error) {
        console.error(`ERROR: Failed to update location for driver ${driverId}:`, error);
    }
});
exports.updateDriverLocation = updateDriverLocation;
/**
 * Retrieves the latest known locations of all drivers.
 * This is useful for populating the map when a user first opens the app.
 * @returns A list of all driver locations.
 */
const getAllDriverLocations = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield driver_location_model_1.default.findAll();
    }
    catch (error) {
        console.error('ERROR: Failed to retrieve all driver locations:', error);
        return [];
    }
});
exports.getAllDriverLocations = getAllDriverLocations;
/**
 * Deletes a driver's location from the database.
 * This should be called when a driver goes offline.
 * @param driverId The ID of the driver.
 */
const removeDriverLocation = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const record = yield driver_location_model_1.default.findOne({ where: { driverId } });
        if (record) {
            yield record.destroy();
        }
    }
    catch (error) {
        console.error(`ERROR: Failed to remove location for driver ${driverId}:`, error);
    }
});
exports.removeDriverLocation = removeDriverLocation;

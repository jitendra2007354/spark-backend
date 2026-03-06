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
exports.deleteVehicle = exports.setDefaultVehicle = exports.listDriverVehicles = exports.addVehicleForDriver = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const vehicle_model_1 = __importDefault(require("../models/vehicle.model"));
/**
 * Adds a new vehicle for a driver.
 */
const addVehicleForDriver = (driverId, vehicleData) => __awaiter(void 0, void 0, void 0, function* () {
    const driver = yield user_model_1.default.findByPk(driverId);
    if (!driver || driver.userType !== 'Driver') {
        throw new Error('Driver not found');
    }
    const newVehicle = yield vehicle_model_1.default.create(Object.assign(Object.assign({ userId: driverId }, vehicleData), { isDefault: false }));
    return newVehicle;
});
exports.addVehicleForDriver = addVehicleForDriver;
/**
 * Lists all vehicles for a specific driver.
 * CORRECTED: This function now filters out soft-deleted vehicles.
 */
const listDriverVehicles = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield vehicle_model_1.default.findAll({ where: { userId: driverId, isDeleted: false } });
});
exports.listDriverVehicles = listDriverVehicles;
/**
 * Sets a vehicle as the default for a driver.
 */
const setDefaultVehicle = (driverId, vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    // First, unset any other default vehicle for this driver
    yield vehicle_model_1.default.update({ isDefault: false }, { where: { userId: driverId } });
    // Then, set the new default vehicle, ensuring it is not deleted
    const [updateCount] = yield vehicle_model_1.default.update({ isDefault: true }, { where: { id: vehicleId, userId: driverId, isDeleted: false } });
    if (updateCount === 0) {
        throw new Error('Vehicle not found or does not belong to this driver.');
    }
    return yield vehicle_model_1.default.findByPk(vehicleId);
});
exports.setDefaultVehicle = setDefaultVehicle;
/**
 * Deletes a vehicle for a driver by marking it as deleted (soft delete).
 * CORRECTED: This function now performs a soft delete instead of a hard delete.
 */
const deleteVehicle = (driverId, vehicleId) => __awaiter(void 0, void 0, void 0, function* () {
    // We use update to set an 'isDeleted' flag instead of destroying the record
    const [updateCount] = yield vehicle_model_1.default.update({ isDeleted: true }, { where: { id: vehicleId, userId: driverId } });
    if (updateCount === 0) {
        throw new Error('Vehicle not found or does not belong to this driver.');
    }
    return { message: 'Vehicle deleted successfully' };
});
exports.deleteVehicle = deleteVehicle;

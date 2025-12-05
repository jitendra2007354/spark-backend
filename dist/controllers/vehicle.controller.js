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
exports.removeVehicle = exports.setAsDefault = exports.getVehicles = exports.addVehicle = void 0;
const vehicle_service_1 = require("../services/vehicle.service");
const addVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const driverId = req.user.id;
    try {
        const newVehicle = yield (0, vehicle_service_1.addVehicleForDriver)(driverId, req.body);
        res.status(201).json(newVehicle);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add vehicle', message: error.message });
    }
});
exports.addVehicle = addVehicle;
const getVehicles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const driverId = req.user.id;
    try {
        const vehicles = yield (0, vehicle_service_1.listDriverVehicles)(driverId);
        res.status(200).json(vehicles);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve vehicles', message: error.message });
    }
});
exports.getVehicles = getVehicles;
const setAsDefault = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const driverId = req.user.id;
    const { vehicleId } = req.params;
    try {
        const updatedVehicle = yield (0, vehicle_service_1.setDefaultVehicle)(driverId, parseInt(vehicleId, 10));
        res.status(200).json(updatedVehicle);
    }
    catch (error) {
        res.status(404).json({ error: 'Failed to set default vehicle', message: error.message });
    }
});
exports.setAsDefault = setAsDefault;
const removeVehicle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const driverId = req.user.id;
    const { vehicleId } = req.params;
    try {
        yield (0, vehicle_service_1.deleteVehicle)(driverId, parseInt(vehicleId, 10));
        res.status(200).json({ message: 'Vehicle deleted successfully' });
    }
    catch (error) {
        res.status(404).json({ error: 'Failed to delete vehicle', message: error.message });
    }
});
exports.removeVehicle = removeVehicle;

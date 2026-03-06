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
exports.findNearbyDrivers = void 0;
const location_service_1 = require("./location.service");
/**
 * Finds nearby available drivers for a customer.
 */
const findNearbyDrivers = (customerLat_1, customerLng_1, ...args_1) => __awaiter(void 0, [customerLat_1, customerLng_1, ...args_1], void 0, function* (customerLat, customerLng, radiusInKm = 5) {
    // Use the centralized location service which queries the DriverLocation table
    // This ensures we get drivers who are actually online and have reported their location via WebSocket
    return yield (0, location_service_1.findAllNearbyDrivers)(customerLat, customerLng, radiusInKm);
});
exports.findNearbyDrivers = findNearbyDrivers;

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
exports.findNearbyDrivers = void 0;
const sequelize_1 = require("sequelize");
const user_model_1 = __importDefault(require("../models/user.model"));
/**
 * Finds nearby available drivers for a customer.
 * This uses a simplified distance calculation.
 */
const findNearbyDrivers = (customerLat_1, customerLng_1, ...args_1) => __awaiter(void 0, [customerLat_1, customerLng_1, ...args_1], void 0, function* (customerLat, customerLng, radiusInKm = 5) {
    // A simplified bounding box calculation. For real-world applications, use PostGIS or a more accurate formula.
    const latConversion = 111.32; // km per degree latitude
    const lngConversion = latConversion * Math.cos(customerLat * (Math.PI / 180));
    const latDelta = radiusInKm / latConversion;
    const lngDelta = radiusInKm / lngConversion;
    const minLat = customerLat - latDelta;
    const maxLat = customerLat + latDelta;
    const minLng = customerLng - lngDelta;
    const maxLng = customerLng + lngDelta;
    const drivers = yield user_model_1.default.findAll({
        where: {
            userType: 'Driver',
            isOnline: true,
            currentLat: {
                [sequelize_1.Op.between]: [minLat, maxLat],
            },
            currentLng: {
                [sequelize_1.Op.between]: [minLng, maxLng],
            },
        },
        // Exclude sensitive data from the result
        attributes: {
            exclude: ['otp', 'otpExpires', 'createdAt', 'updatedAt'],
        },
    });
    // For more accuracy, you could filter further by the Haversine distance here.
    return drivers;
});
exports.findNearbyDrivers = findNearbyDrivers;

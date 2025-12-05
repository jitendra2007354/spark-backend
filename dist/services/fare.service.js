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
exports.calculateFare = void 0;
const config_service_1 = require("./config.service");
/**
 * Calculates the estimated fare for a ride based on distance, duration, and applicable configuration.
 */
const calculateFare = (distance, // in meters
duration, // in seconds
city, vehicleType) => __awaiter(void 0, void 0, void 0, function* () {
    const config = yield (0, config_service_1.getApplicableConfig)(city, vehicleType);
    // Extract rates from the flexible config object, with fallbacks
    const baseFare = config.baseFare || 50;
    const perKilometerRate = config.perKmRate || 12;
    const perMinuteRate = config.perMinuteRate || 1;
    // Basic fare calculation
    const distanceInKm = distance / 1000;
    const durationInMin = duration / 60;
    const distanceFare = distanceInKm * perKilometerRate;
    const timeFare = durationInMin * perMinuteRate;
    let totalFare = baseFare + distanceFare + timeFare;
    // Apply surge pricing if applicable (example logic)
    const surgeMultiplier = config.surgeMultiplier || 1;
    totalFare *= surgeMultiplier;
    // Add taxes and fees
    const taxRate = config.taxRate || 0.05; // 5% tax
    const commissionRate = config.commissionRate || 0.15; // 15% commission
    const taxAmount = totalFare * taxRate;
    const commissionAmount = totalFare * commissionRate;
    const finalFare = totalFare + taxAmount;
    return {
        fare: Math.round(finalFare * 100) / 100, // Round to 2 decimal places
        details: {
            baseFare,
            distanceFare,
            timeFare,
            surgeMultiplier,
            subtotal: totalFare,
            taxAmount,
            commissionAmount,
        },
    };
});
exports.calculateFare = calculateFare;

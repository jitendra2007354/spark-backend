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
exports.getDistanceAndDuration = void 0;
/**
 * Mocks the Google Maps API for distance and duration calculation.
 * In a real application, this would call the Google Maps Distance Matrix API.
 * @param origin - The starting point.
 * @param destination - The ending point.
 * @returns A promise that resolves to the distance in meters and duration in seconds.
 */
const getDistanceAndDuration = (origin, destination) => __awaiter(void 0, void 0, void 0, function* () {
    // Mocked values for demonstration purposes
    const distance = Math.floor(Math.random() * 20000) + 5000; // 5km to 25km
    const duration = Math.floor(distance / 15) + (Math.random() * 600); // Average speed of ~54km/h + random traffic delay
    return { distance, duration };
});
exports.getDistanceAndDuration = getDistanceAndDuration;

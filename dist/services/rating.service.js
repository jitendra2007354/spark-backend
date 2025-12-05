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
exports.getRatingsForUser = exports.submitRating = void 0;
const ride_model_1 = __importDefault(require("../models/ride.model"));
const rating_model_1 = __importDefault(require("../models/rating.model"));
const submitRating = (rideId, raterId, // The user giving the rating
ratedId, // The user being rated
rating, comment) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.default.findByPk(rideId);
    if (!ride)
        throw new Error('Ride not found');
    // Security check: Only the customer or driver from the ride can rate it
    if (ride.customerId !== raterId && ride.driverId !== raterId) {
        throw new Error('You are not authorized to rate this ride.');
    }
    if (ride.status !== 'completed')
        throw new Error('You can only rate completed rides.');
    const newRating = yield rating_model_1.default.create({
        rideId,
        raterId,
        ratedId,
        rating,
        comment,
    });
    // TODO: Update the driver's or user's average rating
    // This would involve fetching all ratings for the user and recalculating
    return newRating;
});
exports.submitRating = submitRating;
const getRatingsForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const ratings = yield rating_model_1.default.findAll({ where: { ratedId: userId } });
    return ratings;
});
exports.getRatingsForUser = getRatingsForUser;

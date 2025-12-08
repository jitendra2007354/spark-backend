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
exports.getRatingsForUser = exports.submitRating = void 0;
const ride_model_1 = __importStar(require("../models/ride.model"));
const rating_model_1 = __importDefault(require("../models/rating.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
// This function is exported correctly.
const submitRating = (rideId, raterId, // The ID of the user giving the rating
ratedUserType, // Type of user being rated
rating, comment) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_model_1.default.findByPk(rideId);
    if (!ride)
        throw new Error('Ride not found');
    // Security check: Only the customer or driver from the ride can rate it.
    if (ride.customerId !== raterId && ride.driverId !== raterId) {
        throw new Error('You are not authorized to rate this ride.');
    }
    // Logic check: You can only rate completed rides. This was a source of a build error.
    if (ride.status !== ride_model_1.RideStatus.COMPLETED) { // Use the correct enum value
        throw new Error('You can only rate completed rides.');
    }
    // Determine who is being rated
    const ratedId = ratedUserType === 'driver' ? ride.driverId : ride.customerId;
    if (!ratedId) {
        throw new Error(`Cannot submit rating. The ${ratedUserType} does not exist for this ride.`);
    }
    // Prevent duplicate ratings
    const existingRating = yield rating_model_1.default.findOne({ where: { rideId, raterId, ratedId } });
    if (existingRating) {
        throw new Error('You have already rated this user for this ride.');
    }
    const newRating = yield rating_model_1.default.create({
        rideId,
        raterId,
        ratedId,
        rating,
        comment,
    });
    // Update the average rating of the user who was rated
    const allRatings = yield rating_model_1.default.findAll({ where: { ratedId } });
    const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allRatings.length;
    if (ratedUserType === 'driver') {
        yield driver_model_1.default.update({ averageRating: averageRating }, { where: { id: ratedId } });
    }
    else {
        yield user_model_1.default.update({ averageRating: averageRating }, { where: { id: ratedId } });
    }
    return newRating;
});
exports.submitRating = submitRating;
// This function is also exported correctly.
const getRatingsForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const ratings = yield rating_model_1.default.findAll({ where: { ratedId: userId }, include: [{ model: user_model_1.default, as: 'rater', attributes: ['id', 'name', 'photoUrl'] }] });
    return ratings;
});
exports.getRatingsForUser = getRatingsForUser;

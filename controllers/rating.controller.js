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
exports.getRatingsController = exports.createRatingController = void 0;
const rating_service_1 = require("../services/rating.service");
const ride_model_1 = __importDefault(require("../models/ride.model"));
/**
 * Controller to handle the submission of a new ride rating.
 */
const createRatingController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { rideId, rating, comment } = req.body;
    // We assume the auth middleware provides the rater's ID
    const raterId = req.user.id;
    try {
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride) {
            return res.status(404).json({ message: 'Ride not found.' });
        }
        // This was the source of a build error. We need to determine the type of user being rated.
        const isCustomerRatingDriver = ride.customerId === raterId;
        const ratedUserType = isCustomerRatingDriver ? 'driver' : 'customer';
        // The ratedId is determined by the service, so we don't need to calculate it here.
        const newRating = yield (0, rating_service_1.submitRating)(rideId, raterId, ratedUserType, rating, comment);
        res.status(201).json(newRating);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to submit rating.', error: error.message });
    }
});
exports.createRatingController = createRatingController;
/**
 * Controller to get all ratings for a specific user (can be a driver or a customer).
 */
const getRatingsController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    try {
        // The service can fetch ratings for any user, abstracting the role.
        const ratings = yield (0, rating_service_1.getRatingsForUser)(Number(userId));
        res.status(200).json(ratings);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to retrieve ratings.', error: error.message });
    }
});
exports.getRatingsController = getRatingsController;

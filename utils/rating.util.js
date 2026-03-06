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
exports.calculateNewDriverRating = void 0;
const rating_model_1 = __importDefault(require("../models/rating.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
/**
 * Recalculates and updates a driver's average rating.
 * @param driverId The ID of the driver to update.
 */
const calculateNewDriverRating = (driverId) => __awaiter(void 0, void 0, void 0, function* () {
    const ratings = yield rating_model_1.default.findAll({ where: { ratedId: driverId } });
    if (ratings.length === 0) {
        return; // No ratings yet, nothing to calculate
    }
    const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
    const averageRating = totalRating / ratings.length;
    // This was the source of a build error. The field is 'averageRating', not 'rating'.
    yield driver_model_1.default.update({ averageRating: averageRating }, { where: { id: driverId } });
});
exports.calculateNewDriverRating = calculateNewDriverRating;

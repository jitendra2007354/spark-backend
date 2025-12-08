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
exports.getCustomerRides = void 0;
const ride_service_1 = require("../services/ride.service");
const getCustomerRides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const customerId = req.user.id;
    try {
        const rides = yield (0, ride_service_1.getCustomerRideHistory)(customerId);
        res.status(200).json(rides);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get ride history', message: error.message });
    }
});
exports.getCustomerRides = getCustomerRides;

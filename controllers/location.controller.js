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
exports.getDriversLocationController = void 0;
const location_service_1 = require("../services/location.service");
/**
 * Controller to handle the retrieval of all active driver locations.
 */
const getDriversLocationController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = yield (0, location_service_1.getAllOnlineDriverLocations)();
        res.status(200).json(locations);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to retrieve driver locations.', error });
    }
});
exports.getDriversLocationController = getDriversLocationController;

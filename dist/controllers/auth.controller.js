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
exports.me = exports.adminLogin = exports.guestLogin = exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
/**
 * Handles the /login request for both customers and drivers.
 * It now accepts pre-formatted data from the frontends.
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Destructure fields directly. The frontends now send data in the correct format.
    const { phoneNumber, firstName, lastName, email, pfp, city, state, vehicleType, vehicleModel, vehicleNumber, driverLicenseNumber, driverLicensePhotoUrl, rcPhotoUrl, } = req.body;
    // Consolidate the data for the service layer.
    // The controller no longer needs to perform transformations like splitting 'name'
    // or renaming 'mobile'.
    const loginData = {
        phoneNumber,
        firstName,
        lastName,
        email,
        pfp,
        city,
        state,
        driverLicenseNumber,
        driverLicensePhotoUrl,
        vehicleModel,
        vehicleNumber,
        vehicleType,
        rcPhotoUrl,
    };
    try {
        const result = yield (0, auth_service_1.loginOrRegister)(loginData);
        res.status(200).json({
            message: 'Login successful',
            token: result.token,
            user: result.user,
        });
    }
    catch (error) {
        console.error('Error in login controller:', error);
        res.status(500).json({ error: 'Failed to login', message: error.message });
    }
});
exports.login = login;
// --- OTHER AUTH FUNCTIONS (UNCHANGED) ---
const guestLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, auth_service_1.loginGuest)();
        res.status(200).json({
            message: 'Guest login successful',
            token: result.token,
            user: result.user,
        });
    }
    catch (error) {
        console.error('Error in guestLogin controller:', error);
        res.status(500).json({ error: 'Failed to login as guest' });
    }
});
exports.guestLogin = guestLogin;
const adminLogin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ message: 'Password is required' });
    }
    try {
        const result = yield (0, auth_service_1.loginAdmin)(password);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(401).json({ message: error.message });
    }
});
exports.adminLogin = adminLogin;
const me = (req, res) => {
    res.status(200).json(req.user);
};
exports.me = me;

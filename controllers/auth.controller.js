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
exports.me = exports.adminLogin = exports.guestLogin = exports.verifyOtp = exports.sendOtp = exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
/**
 * Handles the /login request for both customers and drivers.
 * It now accepts pre-formatted data from the frontends.
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // Destructure fields directly. Use 'let' to allow file uploads to override these values.
    let { phoneNumber, firstName, lastName, email, pfp, city, state, vehicleType, vehicleModel, vehicleNumber, driverLicenseNumber, driverLicensePhotoUrl, rcPhotoUrl } = req.body;
    // Handle file uploads if present (from FormData)
    // We assume the route uses upload.fields([...]) or upload.any()
    const files = req.files;
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    if (files) {
        if (Array.isArray(files)) {
            // Handle upload.any() array
            files.forEach((file) => {
                const url = `${baseUrl}/public/uploads/sponsors/${file.filename}`;
                if (file.fieldname === 'driverLicensePhotoUrl')
                    driverLicensePhotoUrl = url;
                if (file.fieldname === 'rcPhotoUrl')
                    rcPhotoUrl = url;
                if (file.fieldname === 'pfp')
                    pfp = url;
            });
        }
        else {
            if ((_a = files['driverLicensePhotoUrl']) === null || _a === void 0 ? void 0 : _a[0]) {
                driverLicensePhotoUrl = `${baseUrl}/public/uploads/sponsors/${files['driverLicensePhotoUrl'][0].filename}`;
            }
            if ((_b = files['rcPhotoUrl']) === null || _b === void 0 ? void 0 : _b[0]) {
                rcPhotoUrl = `${baseUrl}/public/uploads/sponsors/${files['rcPhotoUrl'][0].filename}`;
            }
            if ((_c = files['pfp']) === null || _c === void 0 ? void 0 : _c[0]) {
                pfp = `${baseUrl}/public/uploads/sponsors/${files['pfp'][0].filename}`;
            }
        }
    }
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
const sendOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { mobile } = req.body;
    if (!mobile)
        return res.status(400).json({ message: 'Mobile number is required' });
    try {
        yield (0, auth_service_1.sendOtpService)(mobile);
        res.status(200).json({ success: true, message: 'OTP sent successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.sendOtp = sendOtp;
const verifyOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { mobile, otp, data } = req.body;
    if (!mobile || !otp)
        return res.status(400).json({ message: 'Mobile and OTP are required' });
    try {
        yield (0, auth_service_1.verifyOtpService)(mobile, otp);
        // Map raw frontend data to service expected format
        const rawData = data || {};
        const nameParts = rawData.name ? rawData.name.split(' ') : [];
        const loginData = {
            phoneNumber: mobile,
            firstName: rawData.firstName || nameParts[0] || 'User',
            lastName: rawData.lastName || nameParts.slice(1).join(' ') || '',
            email: rawData.email,
            pfp: rawData.pfp,
            city: rawData.city,
            state: rawData.state,
            // Driver fields
            vehicleType: rawData.vehicleType,
            vehicleModel: rawData.vehicleModel,
            vehicleNumber: rawData.vehicleNumber,
            driverLicenseNumber: rawData.driverLicenseNumber || rawData.licenseNumber,
            driverLicensePhotoUrl: rawData.driverLicensePhotoUrl || rawData.licensePhoto,
            rcPhotoUrl: rawData.rcPhotoUrl || rawData.rcPhoto,
        };
        const result = yield (0, auth_service_1.loginOrRegister)(loginData);
        res.status(200).json({
            message: 'Login successful',
            token: result.token,
            user: result.user,
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.verifyOtp = verifyOtp;
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

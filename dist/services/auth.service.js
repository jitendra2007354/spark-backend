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
exports.loginWithGoogle = exports.loginAdmin = exports.loginGuest = exports.loginOrRegister = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const user_model_1 = __importDefault(require("../models/user.model"));
const driver_model_1 = __importDefault(require("../models/driver.model"));
const database_service_1 = __importDefault(require("./database.service"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
/**
 * Handles login or registration for both Customers and Drivers.
 */
const loginOrRegister = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { phoneNumber, firstName, lastName, email, pfp, city, state, driverLicenseNumber, driverLicensePhotoUrl, vehicleModel, vehicleNumber, vehicleType, rcPhotoUrl } = data;
    if (!phoneNumber || !firstName || !lastName) {
        throw new Error('Phone number, first name, and last name are required.');
    }
    // Determine userType based on the presence of essential driver data
    const isDriver = !!(driverLicenseNumber && driverLicensePhotoUrl && vehicleNumber && vehicleType && vehicleModel && rcPhotoUrl);
    const userType = isDriver ? 'Driver' : 'Customer';
    // Use a transaction for atomicity
    const transaction = yield database_service_1.default.transaction();
    try {
        // Step 1: Find or Create the User
        const [user, created] = yield user_model_1.default.findOrCreate({
            where: { phoneNumber },
            defaults: {
                firstName,
                lastName,
                phoneNumber,
                email: email,
                pfp: pfp,
                city: city,
                state: state,
                isOnline: true,
                userType: userType, // Set userType dynamically
            },
            transaction: transaction,
        });
        // If the user is a driver and was just created, create their driver profile
        if (isDriver && created) {
            if (!driverLicenseNumber || !driverLicensePhotoUrl) { // Redundant check, but safe
                throw new Error('Driver license number and photo are required for driver registration.');
            }
            yield driver_model_1.default.create({
                userId: user.id,
                driverLicenseNumber: driverLicenseNumber,
                driverLicensePhotoUrl: driverLicensePhotoUrl,
                vehicleModel: vehicleModel,
                vehicleNumber: vehicleNumber,
                vehicleType: vehicleType,
                rcPhotoUrl: rcPhotoUrl,
            }, { transaction: transaction });
        }
        // Handle userType conflicts for existing users
        if (!created && user.userType !== userType) {
            yield transaction.rollback();
            throw new Error(`User with phone number ${phoneNumber} already exists as a ${user.userType}.`);
        }
        // Commit the transaction
        yield transaction.commit();
        // Generate a JWT token
        const token = (0, jsonwebtoken_1.sign)({ id: user.id, phoneNumber: user.phoneNumber, userType: user.userType }, JWT_SECRET, { expiresIn: '30d' });
        return { user, token };
    }
    catch (error) {
        yield transaction.rollback();
        console.error('Error in loginOrRegister service:', error);
        throw error;
    }
});
exports.loginOrRegister = loginOrRegister;
/**
 * Creates a temporary guest user (for customers).
 */
const loginGuest = () => __awaiter(void 0, void 0, void 0, function* () {
    const guestId = `guest_${Math.random().toString(36).substring(2, 9)}`;
    const guestPhoneNumber = `+${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const user = yield user_model_1.default.create({
        firstName: 'Guest',
        lastName: 'User',
        phoneNumber: guestPhoneNumber,
        email: `${guestId}@spark.ride`,
        userType: 'Customer',
        isOnline: true,
    });
    const token = (0, jsonwebtoken_1.sign)({ id: user.id, userType: user.userType }, JWT_SECRET, { expiresIn: '1d' });
    return { user, token };
});
exports.loginGuest = loginGuest;
/**
 * Logs in an admin user.
 */
// src/services/auth.service.ts
/**
 * Logs in an admin user.
 */
const loginAdmin = (password) => __awaiter(void 0, void 0, void 0, function* () {
    // Hardcode the password directly here for demonstration/testing
    const HARDCODED_ADMIN_PASSWORD = "Jitendrasinghchauhan2007@sparkadmin"; // NOT RECOMMENDED FOR PRODUCTION
    if (password !== HARDCODED_ADMIN_PASSWORD) {
        throw new Error('Invalid admin password.');
    }
    // Generate a JWT token for the admin
    // Make sure JWT_SECRET is also defined, perhaps as an environment variable or hardcoded for testing too.
    const token = (0, jsonwebtoken_1.sign)({ id: 'admin', userType: 'Admin' }, JWT_SECRET, { expiresIn: '1d' });
    return { token, user: { id: 'admin', firstName: 'Admin', userType: 'Admin' } };
});
exports.loginAdmin = loginAdmin;
const loginWithGoogle = (googleData) => __awaiter(void 0, void 0, void 0, function* () {
    // Implement Google login logic here
    return { user: null, token: null };
});
exports.loginWithGoogle = loginWithGoogle;

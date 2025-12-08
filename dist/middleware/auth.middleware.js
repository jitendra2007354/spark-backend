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
exports.isCustomer = exports.isDriver = exports.isAdmin = exports.protect = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const user_model_1 = __importDefault(require("../models/user.model")); // Assuming User model definition is here
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';
/**
 * Middleware to verify JWT token and attach user to the request.
 * This now handles the special case for the 'admin' user.
 */
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({ error: 'Access token is required' });
    }
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
        // SPECIAL CASE: Handle the admin user, whose ID is a string 'admin'
        if (decoded.id === 'admin' && decoded.userType === 'Admin') {
            req.user = { id: 'admin', userType: 'Admin' };
            return next();
        }
        // STANDARD CASE: Handle regular users with numeric IDs from the database
        const user = yield user_model_1.default.findByPk(decoded.id);
        if (!user) {
            // Return 401 Unauthorized because the token is for a user that does not exist.
            return res.status(401).json({ error: 'Unauthorized: User for this token not found.' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('JWT verification error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
});
exports.protect = protect;
// --- Role-based Authorization Middleware ---
const isAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userType) !== 'Admin') {
        return res.status(403).json({ error: 'Access forbidden. You must be an admin.' });
    }
    next();
};
exports.isAdmin = isAdmin;
const isDriver = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.userType) !== 'Driver') {
        return res.status(403).json({ error: 'Access forbidden. You must be a driver.' });
    }
    next();
};
exports.isDriver = isDriver;
const isCustomer = (req, res, next) => {
    if (!req.user || req.user.userType !== 'Customer') {
        return res.status(403).json({ error: 'Access forbidden. You must be a customer.' });
    }
    next();
};
exports.isCustomer = isCustomer;

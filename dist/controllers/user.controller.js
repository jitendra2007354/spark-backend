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
exports.registerUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
/**
 * Register a new user.
 * This controller is simplified to not use passwords, aligning with the passwordless login flow.
 */
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, phoneNumber, userType } = req.body;
        // 1. Validate input (password is no longer required)
        if (!firstName || !lastName || !phoneNumber) {
            return res.status(400).json({ message: 'First name, last name, and phone number are required' });
        }
        // 2. Check if user already exists
        const existingUser = yield user_model_1.default.findOne({ where: { phoneNumber } });
        if (existingUser) {
            return res.status(409).json({ message: 'A user with this phone number already exists' });
        }
        // 3. Create the new user (without password)
        const newUser = yield user_model_1.default.create({
            firstName,
            lastName,
            phoneNumber,
            userType: userType || 'Customer', // Default to 'Customer' if not provided
        });
        // 4. Respond with the created user
        // The password field is gone, so no need to delete it from the response
        res.status(201).json(newUser);
    }
    catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.registerUser = registerUser;

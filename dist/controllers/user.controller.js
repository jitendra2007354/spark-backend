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
const bcrypt_1 = __importDefault(require("bcrypt"));
// We need to hash passwords, so let's add bcrypt
// Please run: npm install bcrypt @types/bcrypt
/**
 * Register a new user
 */
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, phoneNumber, password, userType } = req.body;
        // 1. Validate input
        if (!firstName || !lastName || !phoneNumber || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        // 2. Check if user already exists
        const existingUser = yield user_model_1.default.findOne({ where: { phoneNumber } });
        if (existingUser) {
            return res.status(409).json({ message: 'A user with this phone number already exists' });
        }
        // 3. Hash the password for security
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        // 4. Create the new user
        const newUser = yield user_model_1.default.create({
            firstName,
            lastName,
            phoneNumber,
            userType: userType || 'Customer',
            password: hashedPassword,
        });
        // 5. Respond with the created user (excluding password)
        const userResponse = newUser.toJSON();
        delete userResponse.password;
        res.status(201).json(userResponse);
    }
    catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
exports.registerUser = registerUser;

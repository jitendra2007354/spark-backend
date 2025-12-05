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
exports.updateSystemConfig = exports.getSystemConfig = exports.getNotificationHistory = exports.getDriverLocations = exports.getTickets = exports.getPricing = exports.getAllUsers = void 0;
const config_service_1 = require("../services/config.service");
const user_model_1 = __importDefault(require("../models/user.model"));
// Placeholder for a real pricing service
const getPricingRulesFromDb = () => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.resolve({
        base: [{ id: '1', scope: 'Global', baseRate: 50, perUnit: 12, vehicleType: 'Car 4 Seater' }],
        commission: [{ id: '1', scope: 'Global', amount: 15, perRides: 1 }],
        tax: [{ id: '1', scope: 'Global', name: 'GST', value: 5, type: 'Percentage' }],
        penalty: [{ id: '1', scope: 'Global', role: 'Driver', cancelLimit: 3, penaltyAmount: 100 }],
        timings: [{ id: '1', scope: 'Global', acceptTime: 45 }],
    });
});
// Placeholder for a real tickets service
const getTicketsFromDb = () => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.resolve([
        { id: '1', subject: 'Payment Issue', userName: 'Ravi Kumar', userAvatar: 'https://i.pravatar.cc/150?u=ravi', userRole: 'Customer', userMobile: '+919876543210', location: 'Mumbai, MH', description: 'My last payment was deducted twice from my account.', status: 'Open', timestamp: '2 days ago' },
    ]);
});
// Placeholder for real driver location service
const getDriverLocationsFromDb = () => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.resolve([
        { id: 'DRIVER_1', lat: 19.0760, lng: 72.8777 },
        { id: 'DRIVER_2', lat: 28.6139, lng: 77.2090 },
    ]);
});
// Placeholder for real notification history service
const getNotificationHistoryFromDb = () => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.resolve([
        { title: 'Welcome Bonus!', message: 'Get 50% off your next 3 rides.', target: 'All Customers', timestamp: '2024-05-20 10:00 AM' },
    ]);
});
/**
 * Handles the request to get all users.
 */
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.default.findAll({ raw: true }); // Use raw: true to get plain objects
        // In a real app, you'd add revenue, bookings etc. here via joins or separate queries
        const enrichedUsers = users.map(u => (Object.assign(Object.assign({}, u), { avatar: u.pfp || `https://i.pravatar.cc/150?u=${u.email}`, revenue: Math.floor(Math.random() * 5000) + 1000, bookings: Math.floor(Math.random() * 100), totalSpend: Math.floor(Math.random() * 3000), earnings: Math.floor(Math.random() * 4000), penalty: 0, signupDate: (u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'), plan: 'Standard', status: u.isBlocked ? 'Blocked' : 'Active', role: u.userType })));
        res.status(200).json(enrichedUsers);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve users.', message: error.message });
    }
});
exports.getAllUsers = getAllUsers;
/**
 * Handles the request to get all pricing rules.
 */
const getPricing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pricing = yield getPricingRulesFromDb();
        res.status(200).json(pricing);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve pricing.', message: error.message });
    }
});
exports.getPricing = getPricing;
/**
 * Handles the request to get all support tickets.
 */
const getTickets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tickets = yield getTicketsFromDb();
        res.status(200).json(tickets);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve tickets.', message: error.message });
    }
});
exports.getTickets = getTickets;
/**
 * Handles the request to get live driver locations.
 */
const getDriverLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = yield getDriverLocationsFromDb();
        res.status(200).json(locations);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve driver locations.', message: error.message });
    }
});
exports.getDriverLocations = getDriverLocations;
/**
 * Handles the request to get notification history.
 */
const getNotificationHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const history = yield getNotificationHistoryFromDb();
        res.status(200).json(history);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve notification history.', message: error.message });
    }
});
exports.getNotificationHistory = getNotificationHistory;
// --- CONFIG --- //
const getSystemConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).json({}); // This remains a placeholder as per previous analysis
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve system configuration.', message: error.message });
    }
});
exports.getSystemConfig = getSystemConfig;
const updateSystemConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updates = req.body;
    try {
        yield (0, config_service_1.setConfig)(updates);
        res.status(200).json({ message: 'Configuration updated successfully.' });
    }
    catch (error) {
        res.status(400).json({ error: 'Failed to update configuration.', message: error.message });
    }
});
exports.updateSystemConfig = updateSystemConfig;

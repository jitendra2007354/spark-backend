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
exports.createRealtimeNotificationHandler = exports.updateSystemConfig = exports.getSystemConfig = exports.getNotificationHistory = exports.getDriverLocations = exports.getTickets = exports.getPricing = exports.getAllUsers = exports.createUser = exports.sendNotification = exports.deletePricingRule = exports.addPricingRule = exports.getAIAssistantResponse = void 0;
const config_service_1 = require("../services/config.service");
const user_model_1 = __importDefault(require("../models/user.model"));
const ride_model_1 = __importDefault(require("../models/ride.model"));
const support_model_1 = __importDefault(require("../models/support.model"));
const driver_location_model_1 = __importDefault(require("../models/driver-location.model"));
const notification_model_1 = __importDefault(require("../models/notification.model"));
const pricingRule_model_1 = __importDefault(require("../models/pricingRule.model"));
const config_model_1 = __importDefault(require("../models/config.model")); // Import the Config model
const sequelize_1 = require("sequelize");
const generative_ai_1 = require("@google/generative-ai");
const notification_service_1 = require("../services/notification.service");
// --- AI ASSISTANT --- //
const getAIAssistantResponse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { prompt, history, userData, fileBase64, mimeType } = req.body;
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                text: "AI Assistant is disabled on the server. Please configure the GEMINI_API_KEY.",
                action: { type: 'NONE' }
            });
        }
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
        });
        const simplifiedData = userData.map((u) => ({
            id: u.id,
            role: u.role,
            city: u.city,
            state: u.state,
            earnings: u.earnings,
            revenue: u.revenue,
            bookings: u.bookings,
            penalty: u.penalty,
            status: u.status,
            signupDate: u.signupDate
        }));
        const systemInstructionText = `
          You are the intelligent AI Admin Assistant for 'Spark'.
          You must return a JSON object. Do NOT wrap it in markdown blocks. Just raw JSON.
          Structure:
          {
            "text": "Your conversational response here.",
            "action": {
              "type": "BLOCK_USERS" | "UNBLOCK_USERS" | "GENERATE_CHART" | "NAVIGATE" | "UPDATE_PRICING" | "NONE",
              "targetIds": ["id1", "id2"],
              "page": "Analytics" | "Drivers",
              "chartData": { ... },
              "pricingData": { ... }
            }
          }
          Current Date: ${new Date().toISOString().split('T')[0]}
          Current App Data: ${JSON.stringify(simplifiedData.slice(0, 100))}
        `;
        const historyContents = history.map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));
        const currentParts = [{ text: prompt }];
        if (fileBase64 && mimeType) {
            currentParts.push({
                inlineData: {
                    data: fileBase64,
                    mimeType: mimeType
                }
            });
        }
        const contents = [
            { role: 'user', parts: [{ text: systemInstructionText }] }, // Prepend system instruction as a user message
            ...historyContents,
            { role: 'user', parts: currentParts }
        ];
        const request = {
            contents: contents,
            // Removed systemInstruction from here as it's not part of GenerateContentRequest
        };
        const result = yield model.generateContent(request);
        const responseText = result.response.text();
        if (!responseText)
            throw new Error("Empty response from AI");
        res.status(200).json(JSON.parse(responseText));
    }
    catch (error) {
        console.error("Error in AI Assistant backend:", error);
        res.status(500).json({
            text: `An error occurred on the server while processing your request: ${error.message}`,
            action: { type: 'NONE' }
        });
    }
});
exports.getAIAssistantResponse = getAIAssistantResponse;
const addPricingRule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.params;
        const ruleData = req.body;
        const newRule = yield pricingRule_model_1.default.create(Object.assign(Object.assign({}, ruleData), { category: type }));
        res.status(201).json({ message: `'${type}' pricing rule added successfully.`, rule: newRule });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to add pricing rule.', message: error.message });
    }
});
exports.addPricingRule = addPricingRule;
const deletePricingRule = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, id } = req.params;
        const rule = yield pricingRule_model_1.default.findOne({ where: { id, category: type } });
        if (!rule) {
            return res.status(404).json({ error: `Pricing rule with ID ${id} and category '${type}' not found.` });
        }
        yield rule.destroy();
        res.status(200).json({ message: `'${type}' pricing rule ${id} deleted successfully.` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete pricing rule.', message: error.message });
    }
});
exports.deletePricingRule = deletePricingRule;
const sendNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, message } = req.body;
        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required.' });
        }
        // Fetch all users to send them a notification
        const users = yield user_model_1.default.findAll({ attributes: ['id'] });
        if (!users.length) {
            return res.status(404).json({ message: 'No users found to send notification to.' });
        }
        // Create a notification for each user
        const notifications = users.map(user => ({
            title,
            message,
            type: 'general',
            userId: user.id,
        }));
        // Use bulkCreate for efficiency
        yield notification_model_1.default.bulkCreate(notifications);
        res.status(200).json({ message: `Notification sent successfully to ${users.length} users.` });
    }
    catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).json({ error: 'Failed to send notification.', message: error.message });
    }
});
exports.sendNotification = sendNotification;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { firstName, lastName, phoneNumber, email, userType } = req.body;
        if (!firstName || !lastName || !phoneNumber || !userType) {
            return res.status(400).json({ message: 'First name, last name, phone number, and user type are required.' });
        }
        const newUser = yield user_model_1.default.create({
            firstName,
            lastName,
            phoneNumber,
            email,
            userType,
        });
        res.status(201).json(newUser);
    }
    catch (error) {
        console.error('Error creating user:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'A user with this phone number or email already exists.', message: error.message });
        }
        res.status(500).json({ error: 'Failed to create user.', message: error.message });
    }
});
exports.createUser = createUser;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_model_1.default.findAll({
            attributes: { exclude: ['pfp'] },
            raw: true,
        });
        const [customerStats, driverStats] = yield Promise.all([
            ride_model_1.default.findAll({
                where: { status: 'completed' },
                attributes: [
                    'customerId',
                    [sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.col('fare')), 'totalSpend'],
                    [sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('id')), 'bookings'],
                ],
                group: ['customerId'],
                raw: true,
            }),
            ride_model_1.default.findAll({
                where: { status: 'completed' },
                attributes: [
                    'driverId',
                    [sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.col('driverEarning')), 'earnings'],
                    [sequelize_1.Sequelize.fn('SUM', sequelize_1.Sequelize.col('fare')), 'revenue'],
                    [sequelize_1.Sequelize.fn('COUNT', sequelize_1.Sequelize.col('id')), 'bookings'],
                ],
                group: ['driverId'],
                raw: true,
            }),
        ]);
        const statsMap = new Map();
        customerStats.forEach(stat => {
            statsMap.set(stat.customerId, {
                totalSpend: parseFloat(stat.totalSpend),
                bookings: parseInt(stat.bookings, 10),
            });
        });
        driverStats.forEach(stat => {
            const existingStats = statsMap.get(stat.driverId) || {};
            statsMap.set(stat.driverId, Object.assign(Object.assign({}, existingStats), { earnings: parseFloat(stat.earnings), revenue: parseFloat(stat.revenue), driverBookings: parseInt(stat.bookings, 10) }));
        });
        const enrichedUsers = users.map((user) => {
            const stats = statsMap.get(user.id) || {};
            const isDriver = user.userType === 'driver';
            return Object.assign(Object.assign({}, user), { avatar: `https://i.pravatar.cc/150?u=${user.email}`, revenue: isDriver ? (stats.revenue || 0) : 0, bookings: isDriver ? (stats.driverBookings || 0) : (stats.bookings || 0), totalSpend: !isDriver ? (stats.totalSpend || 0) : 0, earnings: isDriver ? (stats.earnings || 0) : 0, penalty: 0, signupDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A', plan: 'Standard', status: user.isBlocked ? 'Blocked' : 'Active', role: user.userType });
        });
        res.status(200).json(enrichedUsers);
    }
    catch (error) {
        console.error('Error retrieving users with stats:', error);
        res.status(500).json({ error: 'Failed to retrieve users.', message: error.message });
    }
});
exports.getAllUsers = getAllUsers;
const getPricing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allRules = yield pricingRule_model_1.default.findAll();
        const pricing = allRules.reduce((acc, rule) => {
            const category = rule.category.toLowerCase();
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(rule);
            return acc;
        }, {});
        res.status(200).json(pricing);
    }
    catch (error) {
        console.error('Error retrieving pricing rules:', error);
        res.status(500).json({ error: 'Failed to retrieve pricing.', message: error.message });
    }
});
exports.getPricing = getPricing;
const getTickets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tickets = yield support_model_1.default.findAll({
            include: [{
                    model: user_model_1.default,
                    as: 'user',
                    attributes: ['firstName', 'lastName', 'userType', 'phoneNumber', 'email', 'city', 'state']
                }],
            order: [['createdAt', 'DESC']]
        });
        const formattedTickets = tickets.map((ticket) => {
            const user = ticket.user;
            return {
                id: ticket.id,
                subject: ticket.subject,
                description: ticket.description,
                status: ticket.status,
                timestamp: ticket.createdAt,
                userName: user ? `${user.firstName} ${user.lastName}` : 'N/A',
                userAvatar: user ? `https://i.pravatar.cc/150?u=${user.email}` : '',
                userRole: user ? user.userType : 'N/A',
                userMobile: user ? user.phoneNumber : 'N/A',
                location: (user && user.city && user.state) ? `${user.city}, ${user.state}` : 'N/A'
            };
        });
        res.status(200).json(formattedTickets);
    }
    catch (error) {
        console.error('Error retrieving tickets:', error);
        res.status(500).json({ error: 'Failed to retrieve tickets.', message: error.message });
    }
});
exports.getTickets = getTickets;
const getDriverLocations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const locations = yield driver_location_model_1.default.findAll({
            include: [{
                    model: user_model_1.default,
                    as: 'driver',
                    attributes: ['firstName', 'lastName', 'phoneNumber', 'currentStatus']
                }]
        });
        const formattedLocations = locations.map((loc) => ({
            id: loc.driverId,
            lat: loc.latitude,
            lng: loc.longitude,
            driverName: loc.driver ? `${loc.driver.firstName} ${loc.driver.lastName}` : 'N/A',
            driverPhone: loc.driver ? loc.driver.phoneNumber : 'N/A',
            status: loc.driver ? loc.driver.currentStatus : 'offline'
        }));
        res.status(200).json(formattedLocations);
    }
    catch (error) {
        console.error('Error retrieving driver locations:', error);
        res.status(500).json({ error: 'Failed to retrieve driver locations.', message: error.message });
    }
});
exports.getDriverLocations = getDriverLocations;
const getNotificationHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const history = yield notification_model_1.default.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(history);
    }
    catch (error) {
        console.error('Error retrieving notification history:', error);
        res.status(500).json({ error: 'Failed to retrieve notification history.', message: error.message });
    }
});
exports.getNotificationHistory = getNotificationHistory;
// --- CONFIG --- //
const getSystemConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // There should only be one config document. Find the first one.
        const config = yield config_model_1.default.findOne();
        res.status(200).json(config || {}); // Return config or empty object if not found
    }
    catch (error) {
        console.error('Error retrieving system configuration:', error);
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
/**
 * Handles the API request to send a real-time notification from the admin panel.
 * This uses the WebSocket service for immediate delivery.
 */
const createRealtimeNotificationHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { target, title, message } = req.body;
    // Basic validation
    if (!target || !title || !message) {
        return res.status(400).json({ error: 'Request must include target, title, and message.' });
    }
    // More specific validation for the target
    const validTargets = ['all', 'drivers', 'customers'];
    if (!validTargets.includes(target) && !Array.isArray(target)) {
        return res.status(400).json({ error: 'Invalid target specified.' });
    }
    try {
        // Note: This does not save the notification to the database, it only sends it.
        yield (0, notification_service_1.sendAdminNotification)(target, { title, message });
        // Respond with 202 Accepted, as the action is handed off to the WebSocket service.
        res.status(202).json({ success: true, message: 'Notification dispatched for real-time delivery.' });
    }
    catch (error) {
        console.error('API Error - Failed to dispatch notification:', error);
        res.status(500).json({ success: false, error: 'Internal server error while dispatching notification.' });
    }
});
exports.createRealtimeNotificationHandler = createRealtimeNotificationHandler;

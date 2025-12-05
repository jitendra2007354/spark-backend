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
const express_1 = require("express");
const chat_service_1 = require("../services/chat.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const ride_model_1 = __importDefault(require("../models/ride.model")); // Corrected import path
const router = (0, express_1.Router)();
// POST /api/chat/send - Send a message
router.post('/send', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const senderId = req.user.id;
        const { rideId, message } = req.body;
        if (!rideId || !message) {
            return res.status(400).json({ error: 'rideId and message are required.' });
        }
        // Determine the receiver
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride) {
            return res.status(404).json({ error: 'Ride not found.' });
        }
        // Ensure the sender is part of the ride
        if (senderId !== ride.customerId && senderId !== ride.driverId) {
            return res.status(403).json({ error: 'You are not part of this ride.' });
        }
        const receiverId = senderId === ride.customerId ? ride.driverId : ride.customerId;
        if (!receiverId) {
            return res.status(400).json({ error: 'Could not determine the recipient of the message.' });
        }
        const chatMessage = yield (0, chat_service_1.sendMessage)(rideId, senderId, receiverId, message);
        res.status(201).json(chatMessage);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to send message.', message: error.message });
    }
}));
// GET /api/chat/messages/:rideId - Get all messages for a ride
router.get('/messages/:rideId', auth_middleware_1.protect, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user.id;
        const { rideId } = req.params;
        // Optional: Verify user is part of the ride before allowing them to see messages
        const ride = yield ride_model_1.default.findByPk(rideId);
        if (!ride || (ride.customerId !== userId && ride.driverId !== userId)) {
            return res.status(403).json({ error: 'You are not authorized to view these messages.' });
        }
        const messages = yield (0, chat_service_1.getRideMessages)(Number(rideId));
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve messages.', message: error.message });
    }
}));
exports.default = router;

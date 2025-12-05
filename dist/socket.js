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
exports.initSocketIO = void 0;
const socket_io_1 = require("socket.io");
const bidding_service_1 = require("./services/bidding.service");
const chat_service_1 = require("./services/chat.service");
const driver_service_1 = require("./services/driver.service");
// A simple in-memory store for socket IDs to user IDs
const socketUserMap = new Map();
const initSocketIO = (server) => {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*", // TODO: Restrict in production
            methods: ["GET", "POST"],
        },
    });
    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);
        // Store user ID when they connect
        socket.on('register', (userId) => {
            socketUserMap.set(socket.id, userId);
            console.log(`User ${userId} registered with socket ${socket.id}`);
        });
        // --- Bidding ---
        socket.on('joinRideBidding', (rideId) => {
            socket.join(`ride-${rideId}`);
            console.log(`Socket ${socket.id} joined bidding for ride ${rideId}`);
        });
        socket.on('placeBid', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const driverId = socketUserMap.get(socket.id);
            if (!driverId)
                return socket.emit('error', { message: 'User not registered. Please emit "register" event first.' });
            try {
                const bid = yield (0, bidding_service_1.createBid)(data.rideId, driverId, data.amount, data.customerId);
                // Broadcast the new bid to everyone in the ride's bidding room
                io.to(`ride-${bid.rideId}`).emit('bidUpdate', bid);
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to place bid', details: error.message });
            }
        }));
        // --- Chat ---
        socket.on('joinChat', (rideId) => {
            socket.join(`chat-${rideId}`);
            console.log(`Socket ${socket.id} joined chat for ride ${rideId}`);
        });
        socket.on('sendMessage', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const senderId = socketUserMap.get(socket.id);
            if (!senderId)
                return socket.emit('error', { message: 'User not registered.' });
            try {
                const chatMessage = yield (0, chat_service_1.sendMessage)(data.rideId, senderId, data.receiverId, data.message);
                // Send the message to the chat room
                io.to(`chat-${data.rideId}`).emit('newMessage', chatMessage);
            }
            catch (error) {
                socket.emit('error', { message: 'Failed to send message', details: error.message });
            }
        }));
        // --- Location Tracking ---
        socket.on('updateLocation', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const driverId = socketUserMap.get(socket.id);
            if (!driverId)
                return; // Silently fail if user is not registered
            try {
                yield (0, driver_service_1.setDriverOnlineStatus)(driverId, true, { lat: data.lat, lng: data.lng });
            }
            catch (error) {
                // This should probably not emit to the client unless for debugging
            }
        }));
        socket.on('disconnect', () => {
            socketUserMap.delete(socket.id);
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocketIO = initSocketIO;

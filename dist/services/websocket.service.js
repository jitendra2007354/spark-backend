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
exports.sendMessageToAdminRoom = exports.sendMessageToRideRoom = exports.sendMessageToDriver = exports.sendMessageToUser = exports.initWebSocketServer = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const location_service_1 = require("./location.service");
// Correctly import the new ride assignment functions
const ride_chain_service_1 = require("./ride.chain.service");
const ride_service_1 = require("./ride.service");
const chat_service_1 = require("./chat.service");
let io;
const initWebSocketServer = (httpServer) => {
    io = new socket_io_1.Server(httpServer, { path: '/api/ws', cors: { origin: "*" }, transports: ['websocket'] });
    io.use((socket, next) => {
        const token = socket.handshake.query.token;
        if (!token)
            return next(new Error('Authentication error.'));
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            socket.data = { userId: decoded.id, userType: decoded.role };
            next();
        }
        catch (err) {
            next(new Error('Authentication error.'));
        }
    });
    io.on('connection', (socket) => {
        const authSocket = socket;
        const { userId, userType } = authSocket.data;
        authSocket.join(userId.toString());
        if (userType === 'Admin') {
            authSocket.join('admin_room');
            console.log(`Admin ${userId} has joined the admin_room.`);
        }
        // --- Ride Lifecycle Events (Re-architected) ---
        authSocket.on('request_ride', (data, callback) => __awaiter(void 0, void 0, void 0, function* () {
            const newRide = yield (0, ride_service_1.createRide)(Object.assign({ customerId: userId }, data));
            // Start the new, sequential assignment process
            (0, ride_chain_service_1.startRideAssignment)(newRide.id);
            callback({ rideId: newRide.id });
        }));
        // Driver responds to an exclusive offer
        authSocket.on('driver_accept_offer', (data) => {
            if (userType === 'Driver') {
                // The userId comes from the authenticated socket data to ensure security
                (0, ride_chain_service_1.handleDriverAccept)(data.rideId, userId);
            }
        });
        authSocket.on('driver_reject_offer', (data) => {
            if (userType === 'Driver') {
                // The userId comes from the authenticated socket data
                (0, ride_chain_service_1.handleDriverReject)(data.rideId, userId);
            }
        });
        // General cancellation for both customers and drivers
        authSocket.on('cancel_ride', (data) => {
            if (userType === 'Customer' || userType === 'Driver') {
                (0, ride_chain_service_1.handleRideCancellation)(data.rideId, userType);
            }
        });
        // Driver marks the ride as complete
        authSocket.on('complete_ride', (data) => {
            if (userType === 'Driver') {
                (0, ride_chain_service_1.handleRideCompletion)(data.rideId);
            }
        });
        // --- Chat Events ---
        authSocket.on('join_ride_chat', (data) => authSocket.join(`ride_${data.rideId}`));
        authSocket.on('send_chat_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const ride = yield (0, ride_service_1.getRideById)(data.rideId);
            if (!ride || (userId !== ride.customerId && userId !== ride.driverId))
                return;
            const msg = yield (0, chat_service_1.saveChatMessage)({ rideId: data.rideId, senderId: userId, message: data.message });
            io.to(`ride_${data.rideId}`).emit('new_chat_message', msg);
        }));
        // --- Driver Location Events ---
        authSocket.on('location_update', (data) => {
            if (userType === 'Driver') {
                (0, location_service_1.updateDriverLocation)(userId, data.lat, data.lng);
            }
        });
        // --- Admin-Specific Events ---
        authSocket.on('subscribe_admin_live_map', (callback) => __awaiter(void 0, void 0, void 0, function* () {
            if (userType !== 'Admin')
                return callback({ error: 'Unauthorized' });
            try {
                const locations = yield (0, location_service_1.getAllOnlineDriverLocations)();
                callback({ success: true, locations });
            }
            catch (error) {
                callback({ error: 'Failed to fetch locations' });
            }
        }));
        authSocket.on('disconnect', () => {
            if (userType === 'Driver') {
                (0, location_service_1.removeDriverLocation)(userId);
                (0, exports.sendMessageToAdminRoom)('driver_offline', { driverId: userId });
            }
        });
    });
    return io;
};
exports.initWebSocketServer = initWebSocketServer;
// --- Exported Emitter Functions ---
const sendMessageToUser = (userId, event, data) => io === null || io === void 0 ? void 0 : io.to(userId.toString()).emit(event, data);
exports.sendMessageToUser = sendMessageToUser;
const sendMessageToDriver = (driverId, event, data) => (0, exports.sendMessageToUser)(driverId, event, data);
exports.sendMessageToDriver = sendMessageToDriver;
const sendMessageToRideRoom = (rideId, event, data) => io === null || io === void 0 ? void 0 : io.to(`ride_${rideId}`).emit(event, data);
exports.sendMessageToRideRoom = sendMessageToRideRoom;
const sendMessageToAdminRoom = (event, data) => io === null || io === void 0 ? void 0 : io.to('admin_room').emit(event, data);
exports.sendMessageToAdminRoom = sendMessageToAdminRoom;

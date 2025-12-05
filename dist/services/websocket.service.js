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
exports.sendMessageToRideRoom = exports.broadcastMessage = exports.sendMessageToUser = exports.initWebSocketServer = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const location_service_1 = require("./location.service");
const ride_chain_service_1 = require("./ride.chain.service");
const ride_service_1 = require("./ride.service");
const chat_service_1 = require("./chat.service");
const bidding_service_1 = require("./bidding.service");
let io;
const initWebSocketServer = (httpServer) => {
    io = new socket_io_1.Server(httpServer, { path: '/api/ws', cors: { origin: "*" }, transports: ['websocket'] });
    io.use((socket, next) => {
        const token = socket.handshake.query.token;
        if (!token)
            return next(new Error('Authentication error.'));
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
            if (err)
                return next(new Error('Authentication error.'));
            socket.data = { userId: decoded.id, userType: decoded.role };
            next();
        });
    });
    io.on('connection', (socket) => {
        const authSocket = socket;
        const { userId, userType } = authSocket.data;
        authSocket.join(userId.toString());
        authSocket.on('request_ride', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const newRide = yield (0, ride_service_1.createRide)(Object.assign({ customerId: userId }, data));
            (0, ride_chain_service_1.processRideChain)(newRide.id);
            authSocket.emit('ride_initiated', { rideId: newRide.id });
        }));
        authSocket.on('driver_response', (data) => (0, ride_chain_service_1.handleDriverAccept)(data.rideId, userId));
        authSocket.on('cancel_ride', (data) => (0, ride_chain_service_1.handleRideCancellation)(data.rideId));
        authSocket.on('place_bid', (data) => (0, bidding_service_1.createBid)(data.rideId, userId, data.amount, data.customerId));
        authSocket.on('join_ride_chat', (data) => authSocket.join(`ride_${data.rideId}`));
        authSocket.on('send_chat_message', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const ride = yield (0, ride_service_1.getRideById)(data.rideId);
            if (!ride || (userId !== ride.customerId && userId !== ride.driverId))
                return;
            const chatMessage = yield (0, chat_service_1.saveChatMessage)({
                rideId: data.rideId,
                senderId: userId,
                message: data.message,
                fileContent: data.fileContent, // base64 string
                fileType: data.fileType // e.g., 'image/jpeg'
            });
            io.to(`ride_${data.rideId}`).emit('new_chat_message', chatMessage);
        }));
        authSocket.on('location_update', (data) => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, location_service_1.updateDriverLocation)(userId, data.lat, data.lng);
            io.emit('driver_location_updated', { driverId: userId, location: data });
        }));
        authSocket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
            yield (0, location_service_1.removeDriverLocation)(userId);
            io.emit('driver_offline', { driverId: userId });
        }));
    });
    return io;
};
exports.initWebSocketServer = initWebSocketServer;
const sendMessageToUser = (userId, event, data) => io && io.to(userId.toString()).emit(event, data);
exports.sendMessageToUser = sendMessageToUser;
const broadcastMessage = (event, data) => io && io.emit(event, data);
exports.broadcastMessage = broadcastMessage;
const sendMessageToRideRoom = (rideId, event, data) => io && io.to(`ride_${rideId}`).emit(event, data);
exports.sendMessageToRideRoom = sendMessageToRideRoom;

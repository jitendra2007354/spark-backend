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
exports.initSocket = void 0;
const uWebSockets_js_1 = require("uWebSockets.js");
const jsonwebtoken_1 = require("jsonwebtoken");
const bidding_service_1 = require("./services/bidding.service");
const chat_service_1 = require("./services/chat.service");
const driver_model_1 = __importDefault(require("./models/driver.model"));
const location_service_1 = require("./services/location.service");
const ride_chain_service_1 = require("./services/ride.chain.service");
const ride_service_1 = require("./services/ride.service");
const googleMaps_service_1 = require("./services/googleMaps.service");
const socket_service_1 = require("./services/socket.service");
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';
const initSocket = (port) => {
    const app = (0, uWebSockets_js_1.App)().ws('/*', {
        compression: uWebSockets_js_1.SHARED_COMPRESSOR,
        maxPayloadLength: 16 * 1024,
        idleTimeout: 60,
        // Handle Authentication during Upgrade
        upgrade: (res, req, context) => {
            const query = req.getQuery();
            const params = new URLSearchParams(query);
            const token = params.get('token');
            if (!token) {
                res.writeStatus('401 Unauthorized').end();
                return;
            }
            try {
                const decoded = (0, jsonwebtoken_1.verify)(token, JWT_SECRET);
                res.upgrade({ id: decoded.id, userType: decoded.userType }, // User data attached to socket
                req.getHeader('sec-websocket-key'), req.getHeader('sec-websocket-protocol'), req.getHeader('sec-websocket-extensions'), context);
            }
            catch (err) {
                res.writeStatus('401 Unauthorized').end();
            }
        },
        open: (ws) => {
            const extendedWs = ws;
            const userData = extendedWs.getUserData();
            console.log(`User connected: ${userData.id} (${userData.userType})`);
            if (userData.userType === 'Admin') {
                (0, socket_service_1.registerAdminSocket)(extendedWs);
                extendedWs.subscribe('admin');
            }
            else {
                (0, socket_service_1.registerUserSocket)(Number(userData.id), extendedWs);
            }
        },
        message: (ws, message, isBinary) => __awaiter(void 0, void 0, void 0, function* () {
            const extendedWs = ws;
            const userData = extendedWs.getUserData();
            try {
                const buffer = Buffer.from(message);
                const parsed = JSON.parse(buffer.toString());
                const { event, data } = parsed;
                // --- Bidding & Ride Requests ---
                if (event === 'joinRideBidding') {
                    extendedWs.subscribe(`ride-${data}`);
                    console.log(`User ${userData.id} joined bidding for ride ${data}`);
                }
                else if (event === 'request_ride') {
                    // Calculate distance/duration and create ride
                    const { distance, duration } = yield (0, googleMaps_service_1.getDistanceAndDuration)(data.pickupLocation, data.dropoffLocation);
                    const newRide = yield (0, ride_service_1.createRide)(Object.assign(Object.assign({ customerId: Number(userData.id) }, data), { distance,
                        duration }));
                    // Send confirmation back to creator
                    extendedWs.send(JSON.stringify({ event: 'request_ride_success', data: { rideId: newRide.id } }));
                }
                else if (event === 'placeBid') {
                    if (userData.userType === 'Driver') {
                        const bid = yield (0, bidding_service_1.createBid)(data.rideId, Number(userData.id), data.amount, data.customerId);
                        // Broadcast to room using uWS publish
                        (0, socket_service_1.publishToRoom)(`ride-${bid.rideId}`, 'bidUpdate', bid);
                    }
                    // --- Driver Actions ---
                }
                else if (event === 'driver_accept_offer') {
                    if (userData.userType === 'Driver') {
                        yield (0, ride_chain_service_1.handleDriverAccept)(data.rideId, Number(userData.id));
                    }
                }
                else if (event === 'driver_reject_offer') {
                    if (userData.userType === 'Driver') {
                        yield (0, ride_chain_service_1.handleDriverReject)(data.rideId, Number(userData.id));
                    }
                }
                else if (event === 'complete_ride') {
                    if (userData.userType === 'Driver') {
                        yield (0, ride_chain_service_1.handleRideCompletion)(data.rideId);
                    }
                    // --- General Ride Actions ---
                }
                else if (event === 'cancel_ride') {
                    if (userData.userType === 'Customer' || userData.userType === 'Driver') {
                        yield (0, ride_chain_service_1.handleRideCancellation)(data.rideId, userData.userType);
                    }
                    // --- Chat ---
                }
                else if (event === 'joinChat') {
                    extendedWs.subscribe(`chat-${data}`);
                }
                else if (event === 'sendMessage') {
                    const chatMessage = yield (0, chat_service_1.saveChatMessage)({
                        rideId: data.rideId,
                        senderId: Number(userData.id),
                        receiverId: data.receiverId,
                        message: data.message,
                        fileContent: data.fileContent,
                        fileType: data.fileType
                    });
                    (0, socket_service_1.publishToRoom)(`chat-${data.rideId}`, 'newMessage', chatMessage);
                    // --- Location & Admin ---
                }
                else if (event === 'updateLocation') {
                    if (userData.userType === 'Driver') {
                        // 1. Resolve Driver ID if not cached
                        if (!userData.driverId) {
                            const driver = yield driver_model_1.default.findOne({ where: { userId: userData.id } });
                            if (driver)
                                userData.driverId = driver.id;
                        }
                        if (userData.driverId) {
                            // 2. Throttling Logic
                            const now = Date.now();
                            const lastDbUpdate = userData.lastDbUpdate || 0;
                            const distLat = Math.abs(data.lat - (userData.lastDbLat || 0));
                            const distLng = Math.abs(data.lng - (userData.lastDbLng || 0));
                            const shouldPersist = (now - lastDbUpdate > 15000) || (distLat > 0.002 || distLng > 0.002);
                            if (shouldPersist) {
                                userData.lastDbUpdate = now;
                                userData.lastDbLat = data.lat;
                                userData.lastDbLng = data.lng;
                            }
                            yield (0, location_service_1.updateDriverLocation)(userData.driverId, data.lat, data.lng, shouldPersist);
                        }
                    }
                }
                else if (event === 'subscribe_admin_live_map') {
                    if (userData.userType === 'Admin') {
                        const locations = yield (0, location_service_1.getAllOnlineDriverLocations)();
                        extendedWs.send(JSON.stringify({ event: 'admin_live_map_data', data: { locations } }));
                    }
                }
            }
            catch (e) {
                console.error('WebSocket message error', e);
            }
        }),
        close: (ws, code, message) => {
            const extendedWs = ws;
            const userData = extendedWs.getUserData();
            console.log(`User disconnected: ${userData.id}`);
            if (userData.userType === 'Admin') {
                (0, socket_service_1.removeAdminSocket)(extendedWs);
            }
            else {
                if (userData.userType === 'Driver') {
                    (0, location_service_1.removeDriverLocation)(Number(userData.id));
                }
                (0, socket_service_1.removeUserSocket)(Number(userData.id));
            }
        }
    });
    (0, socket_service_1.initSocketService)(app);
    app.listen(port, (token) => {
        if (token) {
            console.log('✅ WebSocket Server listening on port ' + port);
        }
        else {
            console.log('❌ Failed to listen to port ' + port);
        }
    });
    return app;
};
exports.initSocket = initSocket;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageToAdminRoom = exports.sendMessageToRoom = exports.publishToRoom = exports.sendPlatformFeeAccessStarted = exports.sendMessageToUser = exports.removeAdminSocket = exports.registerAdminSocket = exports.removeUserSocket = exports.registerUserSocket = exports.initSocketService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const userSocketMap = new Map();
const adminSockets = new Set();
// Redis clients for Pub/Sub scaling
let pub = null;
let sub = null;
let app = null;
const initSocketService = (application) => {
    app = application;
    // Initialize Redis if REDIS_URL is provided or default to localhost
    // This enables scaling across multiple load balancers and backends
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    console.log(`🚀 Initializing Redis for WebSocket scaling: ${redisUrl}`);
    try {
        // Add retry strategy to prevent crashes if Redis is down
        const options = {
            retryStrategy: (times) => Math.min(times * 50, 2000)
        };
        pub = new ioredis_1.default(redisUrl, options);
        sub = new ioredis_1.default(redisUrl, options);
        pub.on('error', (err) => console.error('❌ Redis Pub Error:', err.message));
        sub.on('error', (err) => console.error('❌ Redis Sub Error:', err.message));
        // Subscribe to global channels
        sub.subscribe('ws:direct', 'ws:room', 'ws:admin', (err) => {
            if (err)
                console.error('❌ Failed to subscribe to Redis channels:', err.message);
        });
        sub.on('message', (channel, message) => {
            try {
                const { event, data, userId, room } = JSON.parse(message);
                if (channel === 'ws:direct' && userId) {
                    const ws = userSocketMap.get(userId);
                    if (ws)
                        ws.send(JSON.stringify({ event, data }));
                }
                else if (channel === 'ws:room' && room && app) {
                    app.publish(room, JSON.stringify({ event, data }));
                }
                else if (channel === 'ws:admin') {
                    const msgStr = JSON.stringify({ event, data });
                    adminSockets.forEach(ws => ws.send(msgStr));
                }
            }
            catch (e) {
                console.error('Redis msg error', e);
            }
        });
    }
    catch (e) {
        console.error('Failed to connect to Redis:', e);
    }
};
exports.initSocketService = initSocketService;
const registerUserSocket = (userId, ws) => {
    userSocketMap.set(userId, ws);
};
exports.registerUserSocket = registerUserSocket;
const removeUserSocket = (userId) => {
    userSocketMap.delete(userId);
};
exports.removeUserSocket = removeUserSocket;
const registerAdminSocket = (ws) => {
    adminSockets.add(ws);
};
exports.registerAdminSocket = registerAdminSocket;
const removeAdminSocket = (ws) => {
    adminSockets.delete(ws);
};
exports.removeAdminSocket = removeAdminSocket;
const sendMessageToUser = (userId, event, data) => {
    if (pub) {
        // Publish to Redis so any instance can send to the user
        pub.publish('ws:direct', JSON.stringify({ userId, event, data }));
    }
    else {
        const ws = userSocketMap.get(userId);
        if (ws)
            ws.send(JSON.stringify({ event, data }));
    }
};
exports.sendMessageToUser = sendMessageToUser;
const sendPlatformFeeAccessStarted = (userId, expiry) => {
    // Notify the driver app to start its timer
    (0, exports.sendMessageToUser)(userId, 'PLATFORM_FEE_ACCESS_STARTED', { expiry });
};
exports.sendPlatformFeeAccessStarted = sendPlatformFeeAccessStarted;
const publishToRoom = (room, event, data) => {
    if (pub) {
        // Publish to Redis so all instances publish to their local subscribers
        pub.publish('ws:room', JSON.stringify({ room, event, data }));
    }
    else if (app) {
        app.publish(room, JSON.stringify({ event, data }));
    }
};
exports.publishToRoom = publishToRoom;
exports.sendMessageToRoom = exports.publishToRoom;
const sendMessageToAdminRoom = (event, data) => {
    if (pub) {
        pub.publish('ws:admin', JSON.stringify({ event, data }));
    }
    else {
        const message = JSON.stringify({ event, data });
        adminSockets.forEach(ws => ws.send(message));
    }
};
exports.sendMessageToAdminRoom = sendMessageToAdminRoom;

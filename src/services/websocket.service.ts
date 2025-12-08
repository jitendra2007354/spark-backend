
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { updateDriverLocation, removeDriverLocation, getAllOnlineDriverLocations } from './location.service';
// Correctly import the new ride assignment functions
import { 
    startRideAssignment, 
    handleDriverAccept, 
    handleDriverReject,
    handleRideCancellation, 
    handleRideCompletion 
} from './ride.chain.service';
import { createRide, getRideById } from './ride.service';
import { saveChatMessage } from './chat.service';

interface AuthenticatedSocket extends Socket { data: { userId: number; userType: 'Driver' | 'Customer' | 'Admin'; } }

let io: Server;

export const initWebSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, { path: '/api/ws', cors: { origin: "*" }, transports: ['websocket'] });

  io.use((socket, next) => {
    const token = socket.handshake.query.token as string;
    if (!token) return next(new Error('Authentication error.'));
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        (socket as AuthenticatedSocket).data = { userId: decoded.id, userType: decoded.role };
        next();
    } catch (err) {
        next(new Error('Authentication error.'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId, userType } = authSocket.data;

    authSocket.join(userId.toString());

    if (userType === 'Admin') {
        authSocket.join('admin_room');
        console.log(`Admin ${userId} has joined the admin_room.`);
    }

    // --- Ride Lifecycle Events (Re-architected) ---
    authSocket.on('request_ride', async (data, callback) => {
        const newRide = await createRide({ customerId: userId, ...data });
        // Start the new, sequential assignment process
        startRideAssignment(newRide.id);
        callback({ rideId: newRide.id });
    });

    // Driver responds to an exclusive offer
    authSocket.on('driver_accept_offer', (data) => {
        if (userType === 'Driver') {
            // The userId comes from the authenticated socket data to ensure security
            handleDriverAccept(data.rideId, userId);
        }
    });

    authSocket.on('driver_reject_offer', (data) => {
        if (userType === 'Driver') {
            // The userId comes from the authenticated socket data
            handleDriverReject(data.rideId, userId);
        }
    });

    // General cancellation for both customers and drivers
    authSocket.on('cancel_ride', (data) => {
        if (userType === 'Customer' || userType === 'Driver') {
            handleRideCancellation(data.rideId, userType);
        }
    });

    // Driver marks the ride as complete
    authSocket.on('complete_ride', (data) => {
        if (userType === 'Driver') {
            handleRideCompletion(data.rideId);
        }
    });

    // --- Chat Events ---
    authSocket.on('join_ride_chat', (data) => authSocket.join(`ride_${data.rideId}`));
    authSocket.on('send_chat_message', async (data) => {
        const ride = await getRideById(data.rideId);
        if (!ride || (userId !== ride.customerId && userId !== ride.driverId)) return;
        const msg = await saveChatMessage({ rideId: data.rideId, senderId: userId, message: data.message });
        io.to(`ride_${data.rideId}`).emit('new_chat_message', msg);
    });

    // --- Driver Location Events ---
    authSocket.on('location_update', (data) => {
        if (userType === 'Driver') {
            updateDriverLocation(userId, data.lat, data.lng);
        }
    });

    // --- Admin-Specific Events ---
    authSocket.on('subscribe_admin_live_map', async (callback) => {
        if (userType !== 'Admin') return callback({ error: 'Unauthorized' });
        try {
            const locations = await getAllOnlineDriverLocations();
            callback({ success: true, locations });
        } catch (error) {
            callback({ error: 'Failed to fetch locations' });
        }
    });

    authSocket.on('disconnect', () => {
        if (userType === 'Driver') {
            removeDriverLocation(userId);
            sendMessageToAdminRoom('driver_offline', { driverId: userId });
        }
    });
  });

  return io;
};

// --- Exported Emitter Functions ---
export const sendMessageToUser = (userId: number, event: string, data: any) => io?.to(userId.toString()).emit(event, data);
export const sendMessageToDriver = (driverId: number, event: string, data: any) => sendMessageToUser(driverId, event, data);
export const sendMessageToRideRoom = (rideId: number, event: string, data: any) => io?.to(`ride_${rideId}`).emit(event, data);
export const sendMessageToAdminRoom = (event: string, data: any) => io?.to('admin_room').emit(event, data);

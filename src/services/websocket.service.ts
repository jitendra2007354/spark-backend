
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { updateDriverLocation, removeDriverLocation } from './location.service';
import { processRideChain, handleDriverAccept, handleRideCancellation } from './ride.chain.service';
import { createRide, getRideById } from './ride.service';
import { saveChatMessage } from './chat.service';
import { createBid } from './bidding.service';

interface AuthenticatedSocket extends Socket { data: { userId: number; userType: 'Driver' | 'Customer' | 'Admin'; } }

let io: Server;

export const initWebSocketServer = (httpServer: HttpServer) => {
  io = new Server(httpServer, { path: '/api/ws', cors: { origin: "*" }, transports: ['websocket'] });

  io.use((socket, next) => {
    const token = socket.handshake.query.token as string;
    if (!token) return next(new Error('Authentication error.'));
    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, decoded: any) => {
      if (err) return next(new Error('Authentication error.'));
      (socket as AuthenticatedSocket).data = { userId: decoded.id, userType: decoded.role };
      next();
    });
  });

  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const { userId, userType } = authSocket.data;

    authSocket.join(userId.toString());

    authSocket.on('request_ride', async (data) => {
        const newRide = await createRide({ customerId: userId, ...data });
        processRideChain(newRide.id);
        authSocket.emit('ride_initiated', { rideId: newRide.id });
    });

    authSocket.on('driver_response', (data) => handleDriverAccept(data.rideId, userId));

    authSocket.on('cancel_ride', (data) => handleRideCancellation(data.rideId));

    authSocket.on('place_bid', (data) => createBid(data.rideId, userId, data.amount, data.customerId));

    authSocket.on('join_ride_chat', (data) => authSocket.join(`ride_${data.rideId}`));

    authSocket.on('send_chat_message', async (data) => {
        const ride = await getRideById(data.rideId);
        if (!ride || (userId !== ride.customerId && userId !== ride.driverId)) return;

        const chatMessage = await saveChatMessage({
            rideId: data.rideId,
            senderId: userId,
            message: data.message,
            fileContent: data.fileContent, // base64 string
            fileType: data.fileType       // e.g., 'image/jpeg'
        });

        io.to(`ride_${data.rideId}`).emit('new_chat_message', chatMessage);
    });

    authSocket.on('location_update', async (data) => {
        await updateDriverLocation(userId, data.lat, data.lng);
        io.emit('driver_location_updated', { driverId: userId, location: data });
    });

    authSocket.on('disconnect', async () => {
        await removeDriverLocation(userId);
        io.emit('driver_offline', { driverId: userId });
    });
  });

  return io;
};

export const sendMessageToUser = (userId: number, event: string, data: any) => io && io.to(userId.toString()).emit(event, data);
export const broadcastMessage = (event: string, data: any) => io && io.emit(event, data);
export const sendMessageToRideRoom = (rideId: number, event: string, data: any) => io && io.to(`ride_${rideId}`).emit(event, data);

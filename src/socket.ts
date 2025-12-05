import { Server, Socket } from 'socket.io';
import http from 'http';
import { createBid } from './services/bidding.service';
import { sendMessage } from './services/chat.service';
import { setDriverOnlineStatus } from './services/driver.service';

// A simple in-memory store for socket IDs to user IDs
const socketUserMap = new Map<string, number>();

export const initSocketIO = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // TODO: Restrict in production
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Store user ID when they connect
    socket.on('register', (userId: number) => {
        socketUserMap.set(socket.id, userId);
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // --- Bidding ---
    socket.on('joinRideBidding', (rideId: number) => {
      socket.join(`ride-${rideId}`);
      console.log(`Socket ${socket.id} joined bidding for ride ${rideId}`);
    });

    socket.on('placeBid', async (data: { rideId: number; amount: number; customerId: number }) => {
        const driverId = socketUserMap.get(socket.id);
        if (!driverId) return socket.emit('error', { message: 'User not registered. Please emit "register" event first.'});

        try {
            const bid = await createBid(data.rideId, driverId, data.amount, data.customerId);
            // Broadcast the new bid to everyone in the ride's bidding room
            io.to(`ride-${bid.rideId}`).emit('bidUpdate', bid);
        } catch (error: any) {
            socket.emit('error', { message: 'Failed to place bid', details: error.message });
        }
    });

    // --- Chat ---
    socket.on('joinChat', (rideId: number) => {
        socket.join(`chat-${rideId}`);
        console.log(`Socket ${socket.id} joined chat for ride ${rideId}`);
    });

    socket.on('sendMessage', async (data: { rideId: number, receiverId: number, message: string }) => {
        const senderId = socketUserMap.get(socket.id);
        if (!senderId) return socket.emit('error', { message: 'User not registered.' });

        try {
            const chatMessage = await sendMessage(data.rideId, senderId, data.receiverId, data.message);
            // Send the message to the chat room
            io.to(`chat-${data.rideId}`).emit('newMessage', chatMessage);
        } catch (error: any) {
            socket.emit('error', { message: 'Failed to send message', details: error.message });
        }
    });

    // --- Location Tracking ---
    socket.on('updateLocation', async (data: { lat: number; lng: number }) => {
        const driverId = socketUserMap.get(socket.id);
        if (!driverId) return; // Silently fail if user is not registered

        try {
            await setDriverOnlineStatus(driverId, true, { lat: data.lat, lng: data.lng });

        } catch (error: any) {
            // This should probably not emit to the client unless for debugging
        }
    });


    socket.on('disconnect', () => {
      socketUserMap.delete(socket.id);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
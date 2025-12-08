
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer, Server } from 'http';
import fs from 'fs'; // Import the file system module
import path from 'path'; // Import the path module

import { connectToDatabase } from './services/database.service';
import { initWebSocketServer } from './services/websocket.service';

// --- Import Cron Services ---
import { scheduleChatCleanup, scheduleDriverStatusChecks } from './services/cron.service'; // Updated import
import { scheduleWalletCheck } from './services/wallet.cron.service';

// --- Import Routes ---
import authRoutes from './routes/auth.routes';
import driverRoutes from './routes/driver.routes';
import customerRoutes from './routes/customer.routes';
import vehicleRoutes from './routes/vehicle.routes';
import rideRoutes from './routes/ride.routes';
import adminRoutes from './routes/admin.routes'; 
import supportRoutes from './routes/support.routes';
import walletRoutes from './routes/wallet.routes';
import configRoutes from './routes/config.routes';
import chatRoutes from './routes/chat.routes';
import locationRoutes from './routes/location.routes';
import biddingRoutes from './routes/bidding.routes';
import ratingRoutes from './routes/rating.routes'; 
import userRoutes from './routes/user.routes'; 
import documentRoutes from './routes/document.routes';
import paymentRoutes from './routes/payment.routes';

dotenv.config();

// --- Security Check: Ensure essential environment variables are set ---
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
  process.exit(1); // Exit the process with a failure code
}

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware ---
app.use(helmet());
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/config', configRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/bids', biddingRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api', (req, res) => {
  res.send('Hello from the backend!');
});

// --- Centralized Error-Logging Middleware ---
const errorLogStream = fs.createWriteStream(path.join(__dirname, '..', 'error.log'), { flags: 'a' });
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const now = new Date();
  const logMessage = `[${now.toISOString()}] --- SERVER ERROR ---\nPath: ${req.path}\nMethod: ${req.method}\nError: ${err.stack || err}\n\n`;
  
  console.error("\n\n--- SERVER CRASH DETECTED. See error.log for details. ---\n\n");
  errorLogStream.write(logMessage);
  
  if (!res.headersSent) {
    res.status(500).send('Internal Server Error. Check the error.log file.');
  }
});


// Create a single HTTP server for both Express and WebSockets
const server: Server = createServer(app);

// --- Start Server and Connect to Database ---
const startServer = async () => {
  try {
    await connectToDatabase();
    
    // Initialize the WebSocket server and pass the HTTP server instance
    initWebSocketServer(server);

    // --- Schedule Cron Jobs ---
    scheduleChatCleanup();
    scheduleWalletCheck();
    scheduleDriverStatusChecks(); // Added the new job

    server.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
      console.log(`✅ WebSocket server is listening on ws://localhost:${port}/api/ws`);
    });
  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();

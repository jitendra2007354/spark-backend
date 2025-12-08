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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const fs_1 = __importDefault(require("fs")); // Import the file system module
const path_1 = __importDefault(require("path")); // Import the path module
const database_service_1 = require("./services/database.service");
const websocket_service_1 = require("./services/websocket.service");
// --- Import Cron Services ---
const cron_service_1 = require("./services/cron.service"); // Updated import
const wallet_cron_service_1 = require("./services/wallet.cron.service");
// --- Import Routes ---
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const driver_routes_1 = __importDefault(require("./routes/driver.routes"));
const customer_routes_1 = __importDefault(require("./routes/customer.routes"));
const vehicle_routes_1 = __importDefault(require("./routes/vehicle.routes"));
const ride_routes_1 = __importDefault(require("./routes/ride.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const support_routes_1 = __importDefault(require("./routes/support.routes"));
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const config_routes_1 = __importDefault(require("./routes/config.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const bidding_routes_1 = __importDefault(require("./routes/bidding.routes"));
const rating_routes_1 = __importDefault(require("./routes/rating.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
dotenv_1.default.config();
// --- Security Check: Ensure essential environment variables are set ---
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
    process.exit(1); // Exit the process with a failure code
}
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// --- Middleware ---
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// --- API Routes ---
app.use('/api/auth', auth_routes_1.default);
app.use('/api/drivers', driver_routes_1.default);
app.use('/api/customer', customer_routes_1.default);
app.use('/api/vehicles', vehicle_routes_1.default);
app.use('/api/rides', ride_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/support', support_routes_1.default);
app.use('/api/wallet', wallet_routes_1.default);
app.use('/api/config', config_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
app.use('/api/location', location_routes_1.default);
app.use('/api/bids', bidding_routes_1.default);
app.use('/api/ratings', rating_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.get('/api', (req, res) => {
    res.send('Hello from the backend!');
});
// --- Centralized Error-Logging Middleware ---
const errorLogStream = fs_1.default.createWriteStream(path_1.default.join(__dirname, '..', 'error.log'), { flags: 'a' });
app.use((err, req, res, next) => {
    const now = new Date();
    const logMessage = `[${now.toISOString()}] --- SERVER ERROR ---\nPath: ${req.path}\nMethod: ${req.method}\nError: ${err.stack || err}\n\n`;
    console.error("\n\n--- SERVER CRASH DETECTED. See error.log for details. ---\n\n");
    errorLogStream.write(logMessage);
    if (!res.headersSent) {
        res.status(500).send('Internal Server Error. Check the error.log file.');
    }
});
// Create a single HTTP server for both Express and WebSockets
const server = (0, http_1.createServer)(app);
// --- Start Server and Connect to Database ---
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_service_1.connectToDatabase)();
        // Initialize the WebSocket server and pass the HTTP server instance
        (0, websocket_service_1.initWebSocketServer)(server);
        // --- Schedule Cron Jobs ---
        (0, cron_service_1.scheduleChatCleanup)();
        (0, wallet_cron_service_1.scheduleWalletCheck)();
        (0, cron_service_1.scheduleDriverStatusChecks)(); // Added the new job
        server.listen(port, () => {
            console.log(`🚀 Server is running on http://localhost:${port}`);
            console.log(`✅ WebSocket server is listening on ws://localhost:${port}/api/ws`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start the server:', error);
        process.exit(1);
    }
});
startServer();

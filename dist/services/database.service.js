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
exports.connectToDatabase = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let sequelize;
// Check if we are connecting to TiDB Cloud
const isTiDBConnection = process.env.TIDB_HOST;
if (isTiDBConnection) {
    // Option 1: Connect to TiDB Cloud (Production Recommended)
    if (!process.env.TIDB_USER || !process.env.TIDB_PASSWORD || !process.env.TIDB_DATABASE || !process.env.TIDB_PORT || !process.env.TIDB_CA_CERT) {
        throw new Error('For secure TiDB connections, TIDB_HOST, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE, TIDB_PORT, and TIDB_CA_CERT are required.');
    }
    sequelize = new sequelize_1.Sequelize(process.env.TIDB_DATABASE, process.env.TIDB_USER, process.env.TIDB_PASSWORD, {
        host: process.env.TIDB_HOST,
        port: parseInt(process.env.TIDB_PORT, 10),
        dialect: 'mysql',
        dialectOptions: {
            ssl: {
                // IMPORTANT: You must provide the CA certificate from your TiDB Cloud dashboard for a secure connection.
                ca: process.env.TIDB_CA_CERT,
                // This ensures the connection is rejected if the server certificate cannot be verified.
                rejectUnauthorized: true,
            },
        },
        // Disable logging for production to avoid performance overhead and log noise.
        logging: false,
        // Sequelize handles connection pooling automatically, which is essential for production.
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
}
else {
    // Option 2: Fallback to a local database (For Development Only)
    sequelize = new sequelize_1.Sequelize(process.env.DB_NAME || 'spark', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
        dialect: 'mysql',
        logging: false,
    });
}
/**
 * Establishes and verifies the connection to the database.
 */
const connectToDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
        // DANGEROUS FOR PRODUCTION: `sequelize.sync()` can lead to data loss.
        // It has been removed. Use a dedicated migration library like Sequelize-CLI
        // to manage schema changes in a controlled and safe manner.
        // console.log('🗃️ All models were synchronized successfully.');
    }
    catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        // Re-throwing the error will cause the app to exit, which is a good "fail-fast"
        // strategy if the database is not available on startup.
        throw error;
    }
});
exports.connectToDatabase = connectToDatabase;
exports.default = sequelize;

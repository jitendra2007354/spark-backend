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
    // Production TiDB connection
    if (!process.env.TIDB_USER || !process.env.TIDB_PASSWORD || !process.env.TIDB_DATABASE || !process.env.TIDB_PORT || !process.env.TIDB_CA_CERT) {
        throw new Error('For secure TiDB connections, TIDB_HOST, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE, TIDB_PORT, and TIDB_CA_CERT are required.');
    }
    sequelize = new sequelize_1.Sequelize(process.env.TIDB_DATABASE, process.env.TIDB_USER, process.env.TIDB_PASSWORD, {
        host: process.env.TIDB_HOST,
        port: parseInt(process.env.TIDB_PORT, 10),
        dialect: 'mysql',
        dialectOptions: {
            ssl: {
                ca: process.env.TIDB_CA_CERT,
                rejectUnauthorized: true,
            },
        },
        logging: false,
        pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
    });
}
else {
    // Development local database connection
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
        // IMPORTANT: `sequelize.sync()` is now disabled for production safety.
        // Schema changes must be managed through a dedicated migration library like Sequelize-CLI.
        // This prevents accidental data loss from automatic model synchronization.
        // To re-enable for local development only, you can temporarily uncomment the following:
        /*
        if (process.env.NODE_ENV === 'development') {
          await sequelize.sync({ alter: true });
          console.log('🗃️ [DEV MODE] All models were synchronized with the database.');
        }
        */
    }
    catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error;
    }
});
exports.connectToDatabase = connectToDatabase;
exports.default = sequelize;

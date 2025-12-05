import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize: Sequelize;

// Check if we are connecting to TiDB Cloud
const isTiDBConnection = process.env.TIDB_HOST;

if (isTiDBConnection) {
  // Option 1: Connect to TiDB Cloud (Production Recommended)
  if (!process.env.TIDB_USER || !process.env.TIDB_PASSWORD || !process.env.TIDB_DATABASE || !process.env.TIDB_PORT || !process.env.TIDB_CA_CERT) {
    throw new Error('For secure TiDB connections, TIDB_HOST, TIDB_USER, TIDB_PASSWORD, TIDB_DATABASE, TIDB_PORT, and TIDB_CA_CERT are required.');
  }
  sequelize = new Sequelize(
    process.env.TIDB_DATABASE,
    process.env.TIDB_USER,
    process.env.TIDB_PASSWORD,
    {
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
    }
  );
} else {
  // Option 2: Fallback to a local database (For Development Only)
  sequelize = new Sequelize(
    process.env.DB_NAME || 'spark',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
      dialect: 'mysql',
      logging: false,
    }
  );
}

/**
 * Establishes and verifies the connection to the database.
 */
export const connectToDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');

    // DANGEROUS FOR PRODUCTION: `sequelize.sync()` can lead to data loss.
    // It has been removed. Use a dedicated migration library like Sequelize-CLI
    // to manage schema changes in a controlled and safe manner.
    // console.log('🗃️ All models were synchronized successfully.');

  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    // Re-throwing the error will cause the app to exit, which is a good "fail-fast"
    // strategy if the database is not available on startup.
    throw error;
  }
};

export default sequelize;

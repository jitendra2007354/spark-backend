require('dotenv').config(); // Load variables from .env file

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || 'spark',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql'
  },
  // This is the configuration that Sequelize-CLI will use when you run migrations in a production environment
  production: {
    username: process.env.TIDB_USER,
    password: process.env.TIDB_PASSWORD,
    database: process.env.TIDB_DATABASE,
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      ssl: {
        // Ensure the CA certificate content is correctly formatted in your .env file
        ca: process.env.TIDB_CA_CERT.replace(/\\n/g, '\n'),
        rejectUnauthorized: true
      }
    }
  }
};

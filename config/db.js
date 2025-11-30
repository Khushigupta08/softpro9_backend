// config/db.js
const { Sequelize } = require('sequelize');

// Use PostgreSQL on production (Render), SQLite on local
const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseURL = Boolean(process.env.DATABASE_URL);

let sequelize;

if (isProduction && hasDatabaseURL) {
  // PostgreSQL on Render with DATABASE_URL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else if (isProduction && !hasDatabaseURL) {
  // Production without DATABASE_URL - try to use pg connection string from environment
  console.warn('⚠️  DATABASE_URL not set in production. Attempting to connect with PostgreSQL environment variables.');
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'softpro9_db',
    username: process.env.DB_USER || 'softpro9_user',
    password: process.env.DB_PASSWORD,
    logging: false,
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  // SQLite locally (development only)
  const storageFile = process.env.DB_FILE || './softpro9.db';
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storageFile,
    logging: false,
  });
}

module.exports = sequelize;

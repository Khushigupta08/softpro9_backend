// config/db.js
const { Sequelize } = require('sequelize');

// Use PostgreSQL on production (Render), SQLite on local
const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseURL = Boolean(process.env.DATABASE_URL);

let sequelize;

if (isProduction || hasDatabaseURL) {
  // PostgreSQL on Render or when DATABASE_URL is provided
  const databaseURL = process.env.DATABASE_URL;
  if (!databaseURL) {
    throw new Error('DATABASE_URL is required in production environment');
  }
  
  sequelize = new Sequelize(databaseURL, {
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

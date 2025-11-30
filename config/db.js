// config/db.js
const { Sequelize } = require('sequelize');

// Use PostgreSQL on production (Render), SQLite on local
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction && process.env.DATABASE_URL) {
  // PostgreSQL on Render
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
} else {
  // SQLite locally
  const storageFile = process.env.DB_FILE || './softpro9.db';
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storageFile,
    logging: false,
  });
}

module.exports = sequelize;

// config/db.js
const { Sequelize } = require('sequelize');

// Allow overriding DB file via environment (Render friendly)
const storageFile = process.env.DB_FILE || './softpro9.db';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storageFile,
  logging: false,
});

module.exports = sequelize;

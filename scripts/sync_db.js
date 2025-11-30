const sequelize = require('../config/db');
const HREmail = require('../models/HREmail');

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database successfully.');

    await HREmail.sync({ alter: true });
    console.log('HREmail table synced successfully.');

  } catch (error) {
    console.error('Error syncing database:', error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
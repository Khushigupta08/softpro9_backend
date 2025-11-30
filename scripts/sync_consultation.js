const sequelize = require('../config/db');
const Consultation = require('../models/Consultation');

async function syncConsultationTable() {
  try {
    await Consultation.sync();
    console.log('✅ Consultation table created/synced successfully');
  } catch (error) {
    console.error('❌ Error syncing consultation table:', error);
  }
}

syncConsultationTable();
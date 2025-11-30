const sequelize = require('../config/db');

async function alterTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Add content_data column
    await sequelize.query(`
      ALTER TABLE training_locations 
      ADD COLUMN content_data TEXT
    `);

    console.log('✅ Column content_data added successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

alterTable();

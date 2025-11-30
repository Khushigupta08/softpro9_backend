require('dotenv').config();
const path = require('path');
const sequelize = require(path.join(__dirname, '..', 'config', 'db'));

(async function check() {
  try {
    console.log('Checking database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection OK');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message || err);
    if (err && err.parent) console.error(err.parent);
    process.exit(1);
  }
})();

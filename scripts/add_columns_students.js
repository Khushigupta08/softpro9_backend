const sequelize = require('../config/db');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const [cols] = await sequelize.query("PRAGMA table_info('Students');");
    const names = cols.map(c => c.name);

    if (!names.includes('isVerified')) {
      console.log('Adding isVerified column...');
      await sequelize.query("ALTER TABLE Students ADD COLUMN isVerified INTEGER DEFAULT 0;");
    } else {
      console.log('isVerified already exists');
    }

    if (!names.includes('verificationToken')) {
      console.log('Adding verificationToken column...');
      await sequelize.query("ALTER TABLE Students ADD COLUMN verificationToken TEXT;");
    } else {
      console.log('verificationToken already exists');
    }

    if (!names.includes('verificationExpires')) {
      console.log('Adding verificationExpires column...');
      await sequelize.query("ALTER TABLE Students ADD COLUMN verificationExpires TEXT;");
    } else {
      console.log('verificationExpires already exists');
    }

    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error adding columns:', err.message || err);
    process.exit(1);
  }
})();

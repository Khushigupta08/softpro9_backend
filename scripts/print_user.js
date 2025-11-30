const sequelize = require('../config/db');
const User = require('../models/student/User');

(async () => {
  try {
    await sequelize.authenticate();
    const email = process.argv[2];
    if (!email) {
      console.error('Usage: node scripts/print_user.js user@example.com');
      process.exit(1);
    }
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('User not found');
      process.exit(0);
    }
    console.log(JSON.stringify(user.get({ plain: true }), null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();

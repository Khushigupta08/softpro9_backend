const sequelize = require('../config/db');
const User = require('../models/student/User');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const email = process.argv[2]; // optional email arg
    if (email) {
      const [count] = await User.update(
        { isVerified: true, verificationToken: null, verificationExpires: null },
        { where: { email } }
      );
      console.log(`Updated users for email=${email}: ${count}`);
    } else {
      const [count] = await User.update(
        { isVerified: true, verificationToken: null, verificationExpires: null },
        { where: {} }
      );
      console.log(`Marked all users verified, rows updated: ${count}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
}

run();

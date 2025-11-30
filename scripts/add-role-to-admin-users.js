/**
 * Migration: Add role column to admin Users table if it doesn't exist
 * Usage: node scripts/add-role-to-admin-users.js
 * 
 * This script safely adds the 'role' column to the Users table used by admin auth.
 * If the column already exists, it does nothing.
 * All existing users get role = 'developer' by default.
 */

const sequelize = require('../config/db');
const User = require('../models/admin/User');

async function runMigration() {
  try {
    console.log('🔄 Starting migration: add role column to admin Users table...');

    // Ensure DB is connected
    await sequelize.authenticate();
    console.log('✅ Database authenticated');

    // Sync the model - this will create the Users table with role column if needed
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced - role column added if it was missing');

    // Get all users and check current roles
    const allUsers = await User.findAll();
    console.log(`📊 Total users in database: ${allUsers.length}`);

    // Display info about users
    if (allUsers.length > 0) {
      console.log('\n👥 Current admin users:');
      allUsers.forEach(u => {
        console.log(`  - ID: ${u.id}, Username: ${u.username}, Role: ${u.role || 'undefined'}`);
      });
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Promote specific users to admin role: UPDATE Users SET role="admin" WHERE username="<username>";');
    console.log('  2. Or promote via API once you have admin endpoints.');
    console.log('  3. Test login and verify role is returned in JWT token.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

// Run migration
runMigration();

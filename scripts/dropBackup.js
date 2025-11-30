const sequelize = require("../config/db");

(async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    console.log("Dropping Courses_backup table...");
    await queryInterface.dropTable("Courses_backup");
    console.log("✅ Courses_backup dropped successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error while dropping table:", error);
    process.exit(1);
  }
})();

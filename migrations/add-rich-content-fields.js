'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns to training_locations table
    await queryInterface.addColumn('training_locations', 'content_data', {
      type: Sequelize.TEXT('long'), // For large JSON content
      allowNull: true,
      comment: 'Rich SEO content in JSON format'
    });

    console.log('✅ Added content_data column');
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: Remove the column
    await queryInterface.removeColumn('training_locations', 'content_data');
    console.log('✅ Removed content_data column');
  }
};

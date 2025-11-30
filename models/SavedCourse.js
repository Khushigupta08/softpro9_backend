const { DataTypes } = require("sequelize");
const sequelize = require("./../config/db");

const SavedCourse = sequelize.define("SavedCourse", {
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  }
}, { timestamps: true });

module.exports = SavedCourse;

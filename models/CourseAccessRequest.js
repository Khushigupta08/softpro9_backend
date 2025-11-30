const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CourseAccessRequest = sequelize.define("CourseAccessRequest", {
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: { // 'video' or 'syllabus'
    type: DataTypes.ENUM("video", "syllabus"),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, { timestamps: true });

module.exports = CourseAccessRequest;

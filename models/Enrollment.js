const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Enrollment = sequelize.define("Enrollment", {
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: { // pending, active, cancelled, failed
    type: DataTypes.ENUM("pending", "active", "cancelled", "failed"),
    defaultValue: "pending",
  },
  paymentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  }
}, { timestamps: true });

module.exports = Enrollment;

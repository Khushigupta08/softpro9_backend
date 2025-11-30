const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true   // Google login users ke liye
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

  // Enrollment form fields (optional) - filled once per student
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dob: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: { type: DataTypes.STRING, allowNull: true },
  state: { type: DataTypes.STRING, allowNull: true },
  country: { type: DataTypes.STRING, allowNull: true },
  idDocumentType: { type: DataTypes.STRING, allowNull: true },
  idDocumentNumber: { type: DataTypes.STRING, allowNull: true },
  idDocumentFile: { type: DataTypes.STRING, allowNull: true },
  enrollmentFormFilled: { type: DataTypes.BOOLEAN, defaultValue: false },

  // Verification fields for email/OTP
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  verificationToken: { type: DataTypes.STRING, allowNull: true },
  verificationExpires: { type: DataTypes.DATE, allowNull: true }
}, {
  tableName: "Students"
});

module.exports = User;

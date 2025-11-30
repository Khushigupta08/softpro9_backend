const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Consultation = sequelize.define("Consultation", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  countryCode: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '+91',

  },
  serviceInterest: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  otherService: {
    type: DataTypes.STRING,
  },
  requirementDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  cityCountry: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  companyName: {
    type: DataTypes.STRING,
  },
  website: {
    type: DataTypes.STRING,
  },
  roleDesignation: {
    type: DataTypes.STRING,
  },
  reason: {
    type: DataTypes.ENUM('Business Service/Project', 'Partnership/Collaboration'),
  },
  preferredDateTime: {
    type: DataTypes.DATE,
  },
  consultationMode: {
    type: DataTypes.ENUM('Call', 'WhatsApp', 'Zoom/Google Meet', 'In-person'),
  },
  hearAboutUs: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Contacted', 'Scheduled', 'Completed', 'Cancelled'),
    defaultValue: 'Pending',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Consultation;
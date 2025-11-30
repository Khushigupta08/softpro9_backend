const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Franchise = sequelize.define("Franchise", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: { type: DataTypes.STRING, allowNull: false },
  mobile: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  interested: { type: DataTypes.STRING, allowNull: false },
  ip: { type: DataTypes.STRING },
  status: {
    type: DataTypes.STRING,
    defaultValue: "pending"
  },
  notes: { type: DataTypes.TEXT },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "franchises",
  timestamps: false
});

module.exports = Franchise;

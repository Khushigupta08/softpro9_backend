const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CurrentJobs = sequelize.define("CurrentJobs", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  department: { type: DataTypes.STRING },
  requirement: { type: DataTypes.TEXT }
});

module.exports = CurrentJobs;

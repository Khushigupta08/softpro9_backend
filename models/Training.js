const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Training = sequelize.define("Training", {
  title: { type: DataTypes.STRING, allowNull: false },
  subtitle: { type: DataTypes.STRING },
  modules: { type: DataTypes.JSON }, // Array of strings
  careerPath: { type: DataTypes.TEXT },
  color: { type: DataTypes.STRING }, // e.g. blue
  gradient: { type: DataTypes.STRING } // e.g. from-blue-500 to-blue-600
});

module.exports = Training;

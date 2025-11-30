const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Application = sequelize.define("Application", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING },
  position: { type: DataTypes.STRING, allowNull: false }, // job title user applied for
  experience: { type: DataTypes.FLOAT },
  cover_letter: { type: DataTypes.TEXT },
  resume_file: { type: DataTypes.STRING },  // filename of uploaded resume
  applied_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  current_ctc_amount: { type: DataTypes.FLOAT },
  current_ctc_currency: { type: DataTypes.STRING },
  current_ctc_period: { type: DataTypes.STRING },
  expected_ctc_amount: { type: DataTypes.FLOAT },
  expected_ctc_currency: { type: DataTypes.STRING },
  expected_ctc_period: { type: DataTypes.STRING },
  location: { type: DataTypes.STRING },


});

module.exports = Application;

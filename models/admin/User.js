// models/User.js
const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db");

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
  ,
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'developer',
    validate: {
      isIn: [['admin', 'developer']]
    }
  }
}, {
  tableName: "Users" // 👈 force table name "Users"
});

module.exports = User;

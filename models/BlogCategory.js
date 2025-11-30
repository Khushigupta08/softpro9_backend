const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const BlogCategory = sequelize.define("BlogCategory", {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
});

module.exports = BlogCategory;

const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Batch = sequelize.define("Batch", {
  title: { type: DataTypes.STRING, allowNull: false },
  nextBatchDate: { type: DataTypes.DATEONLY, allowNull: false }
});

module.exports = Batch;

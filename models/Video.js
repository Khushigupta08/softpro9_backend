const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Course = require("./Course");

const Video = sequelize.define("Video", {
  title:       { type: DataTypes.STRING, allowNull: false }, // e.g. 'Table Tutorial'
  video_url:   { type: DataTypes.STRING, allowNull: false },
  video_file:  { type: DataTypes.STRING, allowNull: true },
  courseId:    { type: DataTypes.INTEGER, allowNull: false },
  moduleName:  { type: DataTypes.STRING, allowNull: false }, // e.g. 'HTML'
  topicName:   { type: DataTypes.STRING },                   // e.g. 'Table'
  is_locked:   { type: DataTypes.BOOLEAN, defaultValue: true }
});

Video.belongsTo(Course, { foreignKey: "courseId" });
Course.hasMany(Video, { foreignKey: "courseId" });

module.exports = Video;

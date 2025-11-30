const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Course = sequelize.define("Course", {
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true },
  subtitle: { type: DataTypes.STRING },
  category: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  duration: { type: DataTypes.STRING },
  instructor: { type: DataTypes.STRING },
  instructorBio: { type: DataTypes.TEXT },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  discountPrice: { type: DataTypes.FLOAT, allowNull: true },
  discountPercent: { type: DataTypes.FLOAT, defaultValue: 0 },  
  gstPercent: { type: DataTypes.FLOAT, defaultValue: 18 }, 
  discountEndTime: { type: DataTypes.DATE, allowNull: true },  
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  studentsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  nextBatch: { type: DataTypes.STRING },
  mode: { type: DataTypes.JSON },
  syllabus: { type: DataTypes.JSON },
  features: { type: DataTypes.JSON },
  // gradient: { type: DataTypes.STRING },
  backgroundImageUrl: { type: DataTypes.STRING, allowNull: true },
  backgroundImageFile: { type: DataTypes.STRING, allowNull: true },
  video: { type: DataTypes.STRING },
  learn: { type: DataTypes.JSON },
  metaKeywords: { type: DataTypes.TEXT, allowNull: true },
  level: { type: DataTypes.STRING, allowNull: true },
  tags: { type: DataTypes.TEXT, allowNull: true }
});

/**
 * Find related courses based on category
 * @param {number} courseId - The ID of the current course
 * @param {number} limit - Maximum number of related courses to return (default: 3)
 * @returns {Promise<Array>} Array of related courses or empty array if base course not found
 */
Course.findRelated = async function(courseId, limit = 3) {
  try {
    // 1. Fetch base course to get its category
    const baseCourse = await Course.findByPk(courseId, {
      attributes: ['id', 'category']
    });

    // 2. If course not found, return empty array
    if (!baseCourse) {
      return [];
    }

    // 3. Find courses with same category (excluding current course)
    const relatedCourses = await Course.findAll({
      where: {
        category: baseCourse.category,
        id: { [require("sequelize").Op.ne]: courseId }
      },
      attributes: ['id', 'title', 'slug', 'backgroundImageUrl', 'price', 'discountPrice', 'rating', 'studentsCount', 'category', 'level'],
      limit: limit,
      order: [['id', 'DESC']]
    });

    return relatedCourses;
  } catch (err) {
    console.error('Error fetching related courses:', err);
    return [];
  }
};

module.exports = Course;

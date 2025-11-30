const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const slugify = require('slugify');  // Import slugify

const Blog = sequelize.define("Blog", {
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true, allowNull: false },  // Add slug field
  category: { type: DataTypes.STRING, allowNull: false },
  tag: { type: DataTypes.STRING },
  color: { type: DataTypes.STRING },
  imgUrl: { type: DataTypes.STRING },
  imgFile: { type: DataTypes.STRING },
  excerpt: { type: DataTypes.TEXT },
  createdBy: { type: DataTypes.STRING, allowNull: true }  
}, {
  timestamps: true
});

// Before Validate hook to generate slug from title
Blog.addHook("beforeValidate", (blog) => {
  if (!blog.slug && blog.title) {
    blog.slug = slugify(blog.title, { lower: true, strict: true });
  }
  if (blog.imgUrl && blog.imgFile) {
    throw new Error("Only one image option allowed: URL or File Upload.");
  }
  if (!blog.imgUrl && !blog.imgFile) {
    throw new Error("An image is required (either URL or File Upload).");
  }
});
module.exports = Blog;

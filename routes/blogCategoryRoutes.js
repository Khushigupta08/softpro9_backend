const express = require("express");
const router = express.Router();
const BlogCategory = require("../models/BlogCategory");

// ✅ GET all blog categories
router.get("/", async (req, res) => {
  try {
    const categories = await BlogCategory.findAll({ order: [["name", "ASC"]] });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ POST add new blog category
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const category = await BlogCategory.create({ name });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ PUT update a blog category by ID
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const category = await BlogCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    category.name = name || category.name;
    await category.save();

    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ DELETE a blog category by ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const category = await BlogCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.destroy();
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

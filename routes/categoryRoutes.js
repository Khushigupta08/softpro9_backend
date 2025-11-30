const express = require("express");
const router = express.Router();
const Category = require("../models/Category");

// GET all categories
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [["name", "ASC"]] });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new category
router.post("/", async (req, res) => {
  try {
    const { name, value } = req.body;
    if (!name || !value) return res.status(400).json({ error: "Missing name or value" });
    const category = await Category.create({ name, value });
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

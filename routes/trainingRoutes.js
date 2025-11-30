const express = require("express");
const Training = require("../models/Training");

const router = express.Router();

//  Get all trainings
router.get("/", async (req, res) => {
  try {
    const trainings = await Training.findAll();
    res.json(trainings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single training by ID
router.get("/:id", async (req, res) => {
  try {
    const training = await Training.findByPk(req.params.id);
    if (!training) return res.status(404).json({ error: "Training not found" });
    res.json(training);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Create training
router.post("/", async (req, res) => {
  try {
    const training = await Training.create(req.body);
    res.status(201).json(training);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Update training
router.put("/:id", async (req, res) => {
  try {
    const training = await Training.findByPk(req.params.id);
    if (!training) return res.status(404).json({ error: "Training not found" });

    await training.update(req.body);
    res.json(training);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete training
router.delete("/:id", async (req, res) => {
  try {
    const training = await Training.findByPk(req.params.id);
    if (!training) return res.status(404).json({ error: "Training not found" });

    await training.destroy();
    res.json({ message: "Training deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Batch = require("../models/Batch");

// Get all batches, ordered by date
router.get("/", async (req, res) => {
  try {
     const batches = await Batch.findAll({ order: [["nextBatchDate", "ASC"]] });
      res.json(batches);
   } catch (error) {
   res.status(500).json({ error: "Failed to fetch batches" });
  }
});

// Add a new batch (admin panel)
router.post("/", async (req, res) => {
  const { title, nextBatchDate } = req.body;
  if (!title || !nextBatchDate) {
   return res.status(400).json({ error: "Missing required fields" });
  }
  try {
   const newBatch = await Batch.create({ title, nextBatchDate });
   res.status(201).json(newBatch);
  } catch (error) {
   res.status(500).json({ error: "Failed to create batch" });
 }
});

module.exports = router;

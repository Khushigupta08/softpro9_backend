const express = require("express");
const router = express.Router();
const CourseAccessRequest = require("../models/CourseAccessRequest");

// POST: Save user form submissions for access requests
router.post("/", async (req, res) => {
  try {
    // Capture IP address from request headers or connection info
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Combine form data with IP
    const data = { ...req.body, ipAddress };

    const newRequest = await CourseAccessRequest.create(data);
    res.status(201).json(newRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET: Retrieve all requests (for admin panel)
router.get("/", async (req, res) => {
  try {
    const requests = await CourseAccessRequest.findAll({ order: [["createdAt", "DESC"]] });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// for bulk delete
router.delete("/bulk-delete", async (req, res) => {
  const { ids } = req.body; // Array of IDs
  try {
    await CourseAccessRequest.destroy({ where: { id: ids } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// for manually delete
router.delete("/:id", async (req, res) => {
  try {
    const deletedCount = await CourseAccessRequest.destroy({ where: { id: req.params.id } });
    if (deletedCount === 0) return res.status(404).json({ error: "Request not found" });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

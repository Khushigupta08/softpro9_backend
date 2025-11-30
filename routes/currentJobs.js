const express = require('express');
const router = express.Router();
const CurrentJobs = require('../models/CurrentJobs');

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await CurrentJobs.findAll();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new job
router.post('/', async (req, res) => {
  try {
    const { title, description, department, requirement } = req.body;
    const newJob = await CurrentJobs.create({ title, description, department, requirement });
    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a job by id
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, department, requirement } = req.body;
    const [updated] = await CurrentJobs.update(
      { title, description, department, requirement },
      { where: { id } }
    );
    if (updated === 0) return res.status(404).json({ error: "Job not found" });
    const updatedJob = await CurrentJobs.findByPk(id);
    res.json(updatedJob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a job by id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const deleteCount = await CurrentJobs.destroy({ where: { id } });
    if (deleteCount === 0) return res.status(404).json({ error: "Job not found" });
    res.json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

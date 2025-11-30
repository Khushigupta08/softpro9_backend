const express = require('express');
const router = express.Router();
const HREmail = require('../models/HREmail');

// Get all HR emails
router.get('/', async (req, res) => {
  try {
    const hrEmails = await HREmail.findAll({
      where: { active: true },
      order: [['location', 'ASC']]
    });
    res.json(hrEmails);
  } catch (err) {
    console.error('Error fetching HR emails:', err);
    res.status(500).json({ 
      error: 'Failed to fetch HR emails',
      details: err.message
    });
  }
});

// Add new HR email
router.post('/', async (req, res) => {
  console.log('Received POST request to /api/hr-emails');
  console.log('Request body:', req.body);
  
  try {
    const { location, email } = req.body;
    if (!location || !email) {
      console.log('Validation failed: Missing location or email');
      return res.status(400).json({ error: 'Location and email are required' });
    }

    // Check if email is valid
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if location already exists
    const existingLocation = await HREmail.findOne({ where: { location, active: true } });
    if (existingLocation) {
      console.log('Validation failed: Location already exists');
      return res.status(400).json({ error: 'Location already has an HR email assigned' });
    }

    console.log('Creating new HR email record...');
    const hrEmail = await HREmail.create({ location, email });
    console.log('Created HR email:', hrEmail.toJSON());
    res.status(201).json(hrEmail);
  } catch (err) {
    console.error('Error creating HR email:', err);
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'This location already has an HR email assigned' });
    } else {
      res.status(500).json({ 
        error: 'Failed to create HR email',
        details: err.message
      });
    }
  }
});

// Update HR email
router.put('/:id', async (req, res) => {
  try {
    const { location, email } = req.body;
    const hrEmail = await HREmail.findByPk(req.params.id);
    if (!hrEmail) {
      return res.status(404).json({ error: 'HR Email not found' });
    }
    await hrEmail.update({ location, email });
    res.json(hrEmail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete HR email (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const hrEmail = await HREmail.findByPk(req.params.id);
    if (!hrEmail) {
      return res.status(404).json({ error: 'HR Email not found' });
    }
    await hrEmail.update({ active: false });
    res.json({ message: 'HR Email deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
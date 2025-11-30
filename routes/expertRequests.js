const express = require('express');
const router = express.Router();
const ExpertRequest = require('../models/ExpertRequest');
const { Op } = require("sequelize");

// Import email functions
const {
  sendExpertUserEmail,
  sendExpertAdminNotification,
} = require('../utils/emailService'); 


// Get all expert consultation requests (Admin)
router.get('/', async (req, res) => {
  try {
    const requests = await ExpertRequest.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(requests);
  } catch (error) {
    console.error('Error fetching expert requests:', error);
    res.status(500).json({ error: 'Failed to fetch expert requests' });
  }
});


// Create new expert request (Public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message, expertDate, expertTime } = req.body;

    // Combine date and time to single Date object if both exist
    let expertDateTime = null;
    if (expertDate && expertTime) {
      expertDateTime = new Date(`${expertDate}T${expertTime}:00`);
    }

    // Get user's IP
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Create request record in DB
    const expertRequest = await ExpertRequest.create({
      name,
      email,
      phone,
      message,
      expertDateTime,
      ip
    });

    // Send user confirmation email & admin notification asynchronously
    sendExpertUserEmail(email, name, expertDateTime).catch(console.error);
    sendExpertAdminNotification({
      name,
      email,
      phone,
      message,
      expertDateTime,
      ip
    }).catch(console.error);

    res.status(201).json({
      message: 'Request submitted successfully',
      data: expertRequest
    });
  } catch (error) {
    console.error('Error creating expert request:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});


// Update status of expert request (Admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const expertRequest = await ExpertRequest.findByPk(id);

    if (!expertRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    expertRequest.status = status;
    await expertRequest.save();

    res.json({
      message: 'Status updated successfully',
      data: expertRequest
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});


// Delete expert request (Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const expertRequest = await ExpertRequest.findByPk(id);

    if (!expertRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    await expertRequest.destroy();

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ error: 'Failed to delete request' });
  }
});


// Get request by ID (Admin)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const expertRequest = await ExpertRequest.findByPk(id);

    if (!expertRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(expertRequest);
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({ error: 'Failed to fetch request' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const { verifyRecaptcha } = require('../utils/recaptcha');
const { sendConfirmationEmail, sendAdminNotification } = require('../utils/emailService');

// Create a new consultation request
router.post('/', async (req, res) => {
  try {
    const { recaptchaToken, ...consultationData } = req.body;
    
    // Verify reCAPTCHA
    // const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    // if (!recaptchaValid) {
    //   return res.status(400).json({ error: 'Invalid reCAPTCHA. Please try again.' });
    // }

    // Create consultation request
    const consultation = await Consultation.create(consultationData);
    
    // Send confirmation email to user
    try {
      await sendConfirmationEmail(
        consultationData.email,
        consultationData.fullName
      );
      console.log('✅ Confirmation email sent to user');
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError.message);
      // Don't fail the request if email fails
    }
    
    // Send notification email to admin
    try {
      await sendAdminNotification(consultationData);
      console.log('✅ Notification email sent to admin');
    } catch (emailError) {
      console.error('❌ Failed to send admin notification:', emailError.message);
      // Don't fail the request if email fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully',
      consultation
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting consultation request',
      error: error.message
    });
  }
});

// Get all consultations (admin only)
router.get('/', async (req, res) => {
  try {
    const consultations = await Consultation.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(consultations);
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching consultations',
      error: error.message
    });
  }
});

// Update consultation status (admin only)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const consultation = await Consultation.findByPk(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    consultation.status = status;
    await consultation.save();

    res.json({
      success: true,
      message: 'Consultation status updated successfully',
      consultation
    });
  } catch (error) {
    console.error('Error updating consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating consultation',
      error: error.message
    });
  }
});

// Bulk delete consultations (admin only)
router.delete('/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body; // Expect an array of consultation IDs to delete

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of consultation IDs to delete'
      });
    }

    // Delete consultations with the given IDs
    const deletedCount = await Consultation.destroy({
      where: {
        id: ids
      }
    });

    res.json({
      success: true,
      message: `${deletedCount} consultation(s) deleted successfully`
    });
  } catch (error) {
    console.error('Error bulk deleting consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk deleting consultations',
      error: error.message
    });
  }
});

module.exports = router;
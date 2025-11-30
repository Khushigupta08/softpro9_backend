const express = require('express');
const router = express.Router();
const Course = require('../../models/Course');
const adminAuth = require('../../middleware/adminAuth');
const authorize = require('../../middleware/authorize');

// Update course meta keywords
// Allow both 'admin' and 'developer' to update dynamic content like keywords
router.put('/:id/keywords', adminAuth, authorize('admin', 'developer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { metaKeywords } = req.body;

    // Find the course
    const course = await Course.findByPk(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Update meta keywords
    course.metaKeywords = metaKeywords;
    await course.save();

    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update course keywords', error: err.message });
  }
});

module.exports = router;
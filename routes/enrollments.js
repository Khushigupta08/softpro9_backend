const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

const STUDENT_JWT_SECRET = process.env.STUDENT_JWT_SECRET || 'default_student_secret';

const verifyStudent = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token required' });
  try {
    req.user = jwt.verify(token, STUDENT_JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get enrolled courses for student
router.get('/student', verifyStudent, async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll({ where: { studentId: req.user.id, status: 'active' } });
    const courseIds = enrollments.map(e => e.courseId);
    if (courseIds.length === 0) return res.json([]);
    const courses = await Course.findAll({ where: { id: courseIds } });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch enrollments', error: err.message });
  }
});

// Admin: list all enrollments (simple)
router.get('/all', async (req, res) => {
  try {
    const enrollments = await Enrollment.findAll();
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch enrollments', error: err.message });
  }
});

module.exports = router;

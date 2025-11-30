const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SavedCourse = require('../../models/SavedCourse');
const Course = require('../../models/Course');

const STUDENT_JWT_SECRET = process.env.STUDENT_JWT_SECRET || 'default_student_secret';

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token required' });
  try {
    req.user = jwt.verify(token, STUDENT_JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// GET saved courses for logged-in student
router.get('/', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const saved = await SavedCourse.findAll({ where: { studentId } });
    const courseIds = saved.map(s => s.courseId);
    if (courseIds.length === 0) return res.json([]);

    const courses = await Course.findAll({ where: { id: courseIds } });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch saved courses', error: err.message });
  }
});

// POST toggle save/un-save a course
router.post('/:courseId', verifyToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const courseId = Number(req.params.courseId);
    if (!courseId) return res.status(400).json({ message: 'Invalid course id' });

    const existing = await SavedCourse.findOne({ where: { studentId, courseId } });
    if (existing) {
      await SavedCourse.destroy({ where: { id: existing.id } });
      return res.json({ saved: false });
    }

    await SavedCourse.create({ studentId, courseId });
    return res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to toggle saved course', error: err.message });
  }
});

module.exports = router;

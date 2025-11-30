const express = require('express');
const router = express.Router();
const adminAuth = require('../../../../softpro9_backend/middleware/adminAuth');
const authorize = require('../../../../softpro9_backend/middleware/authorize');
const User = require("../../../models/student/User");
const Enrollment = require("../../../models/Enrollment");
const Course = require("../../../models/Course");

// Use centralized adminAuth and restrict these routes to 'admin' role only

router.get("/", adminAuth, authorize('admin'), async (req, res) => {
  try {
    const students = await User.findAll({
      attributes: ['id', 'username', 'email', 'mobile', 'googleId', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
});

// Get only students who have filled enrollment form AND enrolled in at least one course
router.get('/enrolled', adminAuth, authorize('admin'), async (req, res) => {
  try {
    // find active enrollments
    const enrollments = await Enrollment.findAll({ where: { status: 'active' } });
    const studentIds = [...new Set(enrollments.map(e => e.studentId))];

    if (studentIds.length === 0) return res.json([]);

    const students = await User.findAll({ where: { id: studentIds, enrollmentFormFilled: true } });

    // attach enrolled courses and payment/enrollment info
    const result = await Promise.all(students.map(async (s) => {
      const sEnrolls = enrollments.filter(e => e.studentId === s.id);
      const courseIds = sEnrolls.map(e => e.courseId);
      const courses = await Course.findAll({ where: { id: courseIds } });
      return { user: s, enrollments: sEnrolls, courses };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching enrolled students', error: err.message });
  }
});

// Delete single student (admin)
router.delete('/:id', adminAuth, authorize('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Student not found' });

    // delete enrollments associated
    await Enrollment.destroy({ where: { studentId: id } });
    // delete user
    await user.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete student', error: err.message });
  }
});

// Bulk delete
router.post('/bulk-delete', adminAuth, authorize('admin'), async (req, res) => {
  try {
    const ids = req.body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'ids required' });

    await Enrollment.destroy({ where: { studentId: ids } });
    await User.destroy({ where: { id: ids } });
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    res.status(500).json({ message: 'Bulk delete failed', error: err.message });
  }
});

module.exports = router;

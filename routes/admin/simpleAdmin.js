const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../../models/admin/User');
const adminAuth = require('../../middleware/adminAuth');

const router = express.Router();
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_admin_secret';

// POST /admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'username and password required' });

    const user = await AdminUser.findOne({ where: { username } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, ADMIN_JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ message: 'Login error', error: err.message });
  }
});

// GET /admin/data - protected
router.get('/data', adminAuth, async (req, res) => {
  try {
    // return some basic overview data; extend as needed
    const result = {
      user: req.user,
      message: 'Admin data endpoint working',
      timestamp: new Date().toISOString(),
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching admin data', error: err.message });
  }
});

module.exports = router;

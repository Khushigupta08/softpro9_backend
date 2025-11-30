const jwt = require('jsonwebtoken');
const AdminUser = require('../models/admin/User');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_admin_secret';

// Verifies admin JWT and attaches user record (id, username, role) to req.user
async function adminAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authorization token required' });

    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (!decoded || !decoded.id) return res.status(401).json({ message: 'Invalid token payload' });

    // Attach user info including role by fetching from DB (ensures latest role)
    const user = await AdminUser.findByPk(decoded.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', error: err.message });
  }
}

module.exports = adminAuth;

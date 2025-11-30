const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../../models/student/User');

const STUDENT_JWT_SECRET = process.env.STUDENT_JWT_SECRET || 'default_student_secret';

// ensure upload dir
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'id_docs');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (e) { }

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, UPLOAD_DIR); },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `id_${Date.now()}_${Math.round(Math.random()*1e6)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

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

// Submit enrollment form (multipart/form-data)
router.post('/submit', verifyStudent, upload.single('idDocumentFile'), async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // if already filled, return
    if (user.enrollmentFormFilled) return res.json({ message: 'Already filled' });

    const body = req.body || {};
    const update = {
      firstName: body.firstName || null,
      lastName: body.lastName || null,
      contactNumber: body.contactNumber || null,
      gender: body.gender || null,
      dob: body.dob || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      country: body.country || null,
      idDocumentType: body.idDocumentType || null,
      idDocumentNumber: body.idDocumentNumber || null,
      idDocumentFile: req.file ? path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/') : null,
      enrollmentFormFilled: true
    };

    await user.update(update);

    res.json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit enrollment form', error: err.message });
  }
});

module.exports = router;

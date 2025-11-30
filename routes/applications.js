require('dotenv').config(); 

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const HREmail = require('../models/HREmail');
const jwt = require('jsonwebtoken');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default_admin_secret';

// middleware to verify admin token for admin-only routes
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Token required' });
  try {
    req.user = jwt.verify(token, ADMIN_JWT_SECRET);
    return next();
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
    return res.status(401).json({ message: 'Invalid admin token' });
  }
};

// Multer config 
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Ensure uploads directory exists (multer will fail if directory missing)
if (!fs.existsSync(path.join(__dirname, '..', 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'uploads'), { recursive: true });
}

// Location to HR email mapping
const locationToHrEmail = {
  "Delhi": "hr.del@softpro9.com",
  "Mumbai": "hr.mum@softpro9.com",
  "Bangalore": "hr.blr@softpro9.com",
  "Hyderabad": "hr.hyd@softpro9.com",
  "Chennai": "hr.che@softpro9.com"
};

// Gmail SMTP transporter setup using OAuth2 or App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Using app password from .env
  }
});

// POST route for new application with resume upload
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const {
      name, email, phone, position, experience, cover_letter,
      current_ctc_amount, current_ctc_currency, current_ctc_period,
      expected_ctc_amount, expected_ctc_currency, expected_ctc_period,
      location
    } = req.body;

    const resume_file = req.file ? req.file.filename : null;

    const application = await Application.create({
      name, email, phone, position, experience, cover_letter,
      resume_file,
      current_ctc_amount,
      current_ctc_currency,
      current_ctc_period,
      expected_ctc_amount,
      expected_ctc_currency,
      expected_ctc_period,
      location
    });

    // Get HR email from database
    let hrEmailRecord = await HREmail.findOne({ 
      where: { location, active: true } 
    });
    let hrEmail = hrEmailRecord?.email;

    // Fallback to hardcoded mapping if DB record not found
    if (!hrEmail) {
      hrEmail = locationToHrEmail[location];
      console.log(`No active HREmail DB record found for location='${location}', falling back to mapping: ${hrEmail}`);
    } else {
      console.log(`Found HREmail record for location='${location}': ${hrEmail}`);
    }

    if (hrEmail) {
      const mailBody = `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nPosition: ${position}\nExperience: ${experience} years\nLocation: ${location}\nCover Letter: ${cover_letter}\nCurrent CTC: ${current_ctc_amount} ${current_ctc_currency} (${current_ctc_period})\nExpected CTC: ${expected_ctc_amount} ${expected_ctc_currency} (${expected_ctc_period})`;

      const mailOptions = {
        from: `"Softpro9 Careers" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: hrEmail,
        subject: `New Job Application for ${position} (${location})`,
        text: mailBody,
        attachments: []
      };

      // Also CC applicant so HR and applicant both have copy
      if (email) mailOptions.cc = email;

      if (resume_file) {
        mailOptions.attachments.push({
          filename: resume_file,
          path: path.join(__dirname, '../uploads/', resume_file)
        });
      }

      // Log mail options 
      console.log('Sending application mail, to:', mailOptions.to, 'cc:', mailOptions.cc, 'subject:', mailOptions.subject);

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending mail:", error);
        } else {
          console.log("Mail sent:", info && (info.response || info));
        }
      });
    } else {
      console.warn(`No HR email available for location='${location}'. Skipping mail send.`);
    }

    res.status(201).json(application);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Admin: GET all applications
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const apps = await Application.findAll({ order: [['applied_at', 'DESC']] });
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: bulk delete applications (expects { ids: [..] } in body)
router.delete('/bulk-delete', verifyAdmin, async (req, res) => {
  try {
    const ids = req.body.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'ids required' });
    await Application.destroy({ where: { id: ids } });
    res.json({ success: true, deleted: ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get single application by id
router.get('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const app = await Application.findByPk(id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete single application
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const count = await Application.destroy({ where: { id } });
    if (count === 0) return res.status(404).json({ message: 'Application not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
